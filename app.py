from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from functools import wraps
from flask_cors import CORS
import psycopg2
import psycopg2.extras
from datetime import datetime
import os
import socket
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__, template_folder='.', static_folder='.', static_url_path='')
CORS(app)
app.secret_key = os.environ.get('SECRET_KEY', 'soul_syync_new_secret_key_v2_local_only')

# ─── Database Configuration ───────────────────────────────────────────────────
def get_db():
    try:
        database_url = os.environ.get('DATABASE_URL')
        if not database_url:
            print("DATABASE_URL environment variable is missing")
            return None
        conn = psycopg2.connect(database_url)
        return conn
    except psycopg2.Error as e:
        print(f"DB Connection Error: {e}")
        return None

def run_migrations():
    """Add new columns to existing tables if they don't exist."""
    conn = get_db()
    if not conn:
        return
    try:
        cur = conn.cursor()
        cur.execute("""
            ALTER TABLE bookings
            ADD COLUMN IF NOT EXISTS session_mode VARCHAR(10) DEFAULT 'online';
        """)
        conn.commit()
        print("✓ Migrations complete")
    except Exception as e:
        print(f"Migration warning: {e}")
    finally:
        conn.close()

run_migrations()

# ─── Auth ─────────────────────────────────────────────────────────────────────

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not session.get('logged_in'):
            return redirect(url_for('admin'))
        return f(*args, **kwargs)
    return decorated_function

@app.route('/admin', methods=['GET', 'POST'])
def admin():
    if not session.get('logged_in'):
        error = None
        if request.method == 'POST':
            username = request.form.get('username')
            password = request.form.get('password')
            
            # Superadmin check (uses env variables in production)
            admin_user = os.environ.get('ADMIN_USERNAME', 'taksh')
            admin_pass = os.environ.get('ADMIN_PASSWORD', 'taksh2006')
            if username == admin_user and password == admin_pass:
                session['logged_in'] = True
                session['role'] = 'admin'
                return redirect(url_for('admin'))
                
            # Database admin check
            conn = get_db()
            if conn:
                cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
                cur.execute("SELECT * FROM users WHERE username = %s AND role = 'admin'", (username,))
                user = cur.fetchone()
                if user and user['password'] == password:
                    session['logged_in'] = True
                    session['role'] = 'admin'
                    cur.execute("UPDATE users SET last_login = %s WHERE id = %s", (datetime.now(), user['id']))
                    conn.commit()
                    conn.close()
                    return redirect(url_for('admin'))
                else:
                    error = "Invalid username or password"
                conn.close()
            else:
                error = "Database error"
        return render_template('login.html', error=error)
    return render_template('admin.html')

@app.route('/register-admin', methods=['GET', 'POST'])
def register_admin():
    error = None
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        conn = get_db()
        if conn:
            try:
                cur = conn.cursor()
                cur.execute("INSERT INTO users (username, password, role) VALUES (%s, %s, 'admin')", (username, password))
                conn.commit()
                return redirect(url_for('admin'))
            except psycopg2.IntegrityError:
                error = "Admin username already exists"
            finally:
                conn.close()
        else:
            error = "Database error"
    return render_template('register.html', error=error)

@app.route('/logout')
def logout():
    session.pop('logged_in', None)
    return redirect(url_for('admin'))

# ─── Routes ───────────────────────────────────────────────────────────────────

@app.route('/')
def index():
    return render_template('index.html')

# ─── API: Booking ─────────────────────────────────────────────────────────────

@app.route('/api/book', methods=['POST'])
def book_session():
    data = request.get_json()
    required = ['name', 'email', 'phone', 'service', 'date', 'time']
    if not all(k in data for k in required):
        return jsonify({'success': False, 'message': 'All fields are required'}), 400

    conn = get_db()
    if not conn:
        return jsonify({'success': False, 'message': 'Database unavailable'}), 503

    try:
        cur = conn.cursor()

        # ── One booking per phone per day restriction ─────────────────────────
        cur.execute(
            "SELECT COUNT(*) FROM bookings WHERE phone = %s AND preferred_date = %s AND status != 'cancelled'",
            (data['phone'], data['date'])
        )
        if cur.fetchone()[0] > 0:
            return jsonify({
                'success': False,
                'message': 'This phone number already has a booking for this date. Only one booking per day is allowed per number.'
            }), 400
        # ─────────────────────────────────────────────────────────────────────

        cur.execute("""
            INSERT INTO bookings (name, email, phone, service, preferred_date, preferred_time, message, session_mode, status, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'pending', %s)
        """, (
            data['name'], data['email'], data['phone'],
            data['service'], data['date'], data['time'],
            data.get('message', ''), data.get('session_mode', 'online'), datetime.now()
        ))
        conn.commit()
        return jsonify({'success': True, 'message': 'Booking received! We will confirm shortly.'})
    except psycopg2.Error as e:
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        if conn:
            conn.close()

@app.route('/api/bookings', methods=['GET'])
@login_required
def get_bookings():
    conn = get_db()
    if not conn:
        return jsonify({'success': False, 'data': []}), 503
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cur.execute("SELECT * FROM bookings ORDER BY created_at DESC")
        rows = cur.fetchall()
        result = []
        for r in rows:
            d = dict(r)
            if isinstance(d.get('created_at'), datetime):
                d['created_at'] = d['created_at'].strftime('%Y-%m-%d %H:%M')
            import datetime as dt
            if isinstance(d.get('preferred_date'), dt.date):
                d['preferred_date'] = d['preferred_date'].strftime('%Y-%m-%d')
            result.append(d)
        return jsonify({'success': True, 'data': result})
    except psycopg2.Error as e:
        return jsonify({'success': False, 'data': [], 'message': str(e)}), 500
    finally:
        if conn:
            conn.close()

@app.route('/api/bookings/<int:bid>', methods=['PATCH'])
@login_required
def update_booking(bid):
    data = request.get_json()
    status = data.get('status')
    if status not in ['pending', 'confirmed', 'cancelled', 'rescheduled']:
        return jsonify({'success': False, 'message': 'Invalid status'}), 400
    conn = get_db()
    if not conn:
        return jsonify({'success': False}), 503
    try:
        cur = conn.cursor()
        cur.execute("UPDATE bookings SET status=%s WHERE id=%s", (status, bid))
        conn.commit()
        return jsonify({'success': True})
    except psycopg2.Error as e:
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        if conn:
            conn.close()

@app.route('/api/bookings/<int:bid>', methods=['DELETE'])
@login_required
def delete_booking(bid):
    conn = get_db()
    if not conn:
        return jsonify({'success': False}), 503
    try:
        cur = conn.cursor()
        cur.execute("DELETE FROM bookings WHERE id=%s", (bid,))
        conn.commit()
        return jsonify({'success': True})
    except psycopg2.Error as e:
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        if conn:
            conn.close()

# ─── API: Contact ─────────────────────────────────────────────────────────────

@app.route('/api/contact', methods=['POST'])
def contact():
    data = request.get_json()
    if not all(k in data for k in ['name', 'email', 'message']):
        return jsonify({'success': False, 'message': 'Required fields missing'}), 400

    conn = get_db()
    if not conn:
        return jsonify({'success': False, 'message': 'Database unavailable'}), 503
    try:
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO contacts (name, email, phone, message, created_at)
            VALUES (%s, %s, %s, %s, %s)
        """, (data['name'], data['email'], data.get('phone', ''), data['message'], datetime.now()))
        conn.commit()
        return jsonify({'success': True, 'message': 'Message sent! We will get back to you soon.'})
    except psycopg2.Error as e:
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        if conn:
            conn.close()

@app.route('/api/contacts', methods=['GET'])
@login_required
def get_contacts():
    conn = get_db()
    if not conn:
        return jsonify({'success': False, 'data': []}), 503
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cur.execute("SELECT * FROM contacts ORDER BY created_at DESC")
        rows = cur.fetchall()
        result = []
        for r in rows:
            d = dict(r)
            if isinstance(d.get('created_at'), datetime):
                d['created_at'] = d['created_at'].strftime('%Y-%m-%d %H:%M')
            result.append(d)
        return jsonify({'success': True, 'data': result})
    except psycopg2.Error as e:
        return jsonify({'success': False, 'data': []}), 500
    finally:
        if conn:
            conn.close()

# ─── API: Stats ───────────────────────────────────────────────────────────────

@app.route('/api/stats', methods=['GET'])
@login_required
def get_stats():
    conn = get_db()
    if not conn:
        return jsonify({'bookings': 0, 'contacts': 0, 'confirmed': 0, 'pending': 0})
    try:
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) FROM bookings")
        total_bookings = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM contacts")
        total_contacts = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM bookings WHERE status='confirmed'")
        confirmed = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM bookings WHERE status='pending'")
        pending = cur.fetchone()[0]
        return jsonify({
            'bookings': total_bookings,
            'contacts': total_contacts,
            'confirmed': confirmed,
            'pending': pending
        })
    except:
        return jsonify({'bookings': 0, 'contacts': 0, 'confirmed': 0, 'pending': 0})
    finally:
        if conn:
            conn.close()

if __name__ == '__main__':
    try:
        local_ip = socket.gethostbyname(socket.gethostname())
    except:
        local_ip = '0.0.0.0'
    print('\n' + '='*50)
    print(f'  Soul Syync is running!')
    print(f'  PC:    http://127.0.0.1:5000')
    print(f'  Phone: http://{local_ip}:5000')
    print('='*50 + '\n')
    app.run(debug=True, host='0.0.0.0', port=5000)
