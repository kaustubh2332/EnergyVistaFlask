from flask import * 
app = Flask(__name__)

app.secret_key="energy"
@app.route('/')
def login():
    return render_template('login.html')

@app.route('/dashboard', methods=['POST'])
def dash():
    username = request.form['uname']
    password = request.form['pass']
    if username == "Lamine Yamal" and password=="1234567":
        session['user']=username
        return render_template('/energivista.html')
    else:
        flash("Invalid username or password")
        return redirect('/')

@app.route('/logout')
def logout():
    session.pop('user',default=None)
    return render_template('login.html')
