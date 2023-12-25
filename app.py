import uuid
from flask import Flask, request, make_response, redirect,render_template,jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_socketio import SocketIO,emit
from sqlalchemy import desc
import json

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///site.db'
db = SQLAlchemy(app)
socketio = SocketIO(app)
#DB for store user data like id,name,email
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    country = db.Column(db.String(200), nullable=False)
    cookie = db.Column(db.String(500), nullable=True)

    def __repr__(self):
        return f"User('{self.username}', '{self.email}', '{self.country}')"
#Your DB to store user response
class Comment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    text = db.Column(db.String(500), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    user = db.relationship('User', backref=db.backref('comments', lazy=True))

    def __repr__(self):
        return f"Comment('{self.text}')"
    
class Score(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    score = db.Column(db.Integer, nullable=False)
    user = db.relationship('User', backref=db.backref('scores', lazy=True))
with app.app_context():
    db.create_all()

@app.route('/')
def hello():
    user_id_from_cookie = request.cookies.get('user_id')
    
    if user_id_from_cookie:
        
        user = User.query.get(int(user_id_from_cookie))
        
        if user:
           
            return render_template('index.html')
        else:
           
            return render_template('register.html')
    else:
       
        return render_template('register.html')
    

#handeling user account setup here
@app.route('/registration', methods=['POST'])
def register_user():
    data = request.get_json()

    if not data:
        return jsonify({'error': 'Invalid JSON data'}), 400

    name = data.get('username')
    country = data.get('country')
    email = data.get('email')

    # Check if a user with the same username or email already exists
    existing_user = User.query.filter((User.username == name) | (User.email == email)).first()

    if existing_user:
        # Handle the case where the username or email is already in use
        return jsonify({'error': False}), 400

    new_user = User(username=name, country=country, email=email)

    try:
        db.session.add(new_user)
        db.session.commit()

        max_age_in_seconds = 2 * 365 * 24 * 60 * 60
        response = make_response({'msg':True})
        response.set_cookie('user_id', str(new_user.id), max_age=max_age_in_seconds)
        new_user.cookie = str(new_user.id)
        db.session.commit()

        return response
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
    
@app.route('/login')
def sendLoginPage():
    return render_template('login.html')

@app.route('/loginToServer', methods=['POST'])
def loginUserAgain():
    data = request.get_json()

    if not data:
        return jsonify({'error': 'Invalid JSON data'}), 400

    username = data.get('username')
    email = data.get('email')

    # Find the user in the database
    user = User.query.filter_by(username=username, email=email).first()

    if user:
        # User found, update the cookie
        max_age_in_seconds = 2 * 365 * 24 * 60 * 60
        response = make_response({'msg': True})
        
        while True:
            # Generate a new cookie until it's unique in the database
            new_cookie = generate_unique_cookie()
            if not User.query.filter_by(cookie=new_cookie).first():
                break

        response.set_cookie('user_id', str(user.id), max_age=max_age_in_seconds)
        user.cookie = new_cookie  # Set the unique cookie
        db.session.commit()
        
        return response
    else:
        # User not found, send an error message
        return jsonify({'msg': False}), 404
def generate_unique_cookie():
    # Implement a logic to generate a unique cookie (e.g., using UUID)
    # This is a simplified example; you may need a more sophisticated method
    return str(uuid.uuid4())   
#checking the user rank only retriving top 10 users   
user_scores = {}
@app.route('/currentRank', methods=['GET'])
def calculateCurrentRank():
    data = request.args.get('data')
    
    if data:
        data_dict = json.loads(data)
        player_id = data_dict.get('playerId')
        player_score = data_dict.get('playerScore')

        if player_id and player_score is not None:  # Check if player_id and player_score are present
            if player_score != 0:
                # Check if the user already has a score record
                existing_score = Score.query.filter_by(user_id=player_id).first()

                if existing_score:
                    # Update the existing score only if the user has scored new top (here lowest) score.
                    if player_score < existing_score.score:
                        existing_score.score = player_score
                else:
                    # Create a new score record
                    user = User.query.get(player_id)
                    new_score = Score(user_id=user.id, score=player_score)
                    db.session.add(new_score)

                db.session.commit()

        # Retrieve the top 20 scores with user information in ascending order
        top_scores = (
            db.session.query(User.username, Score.score)
            .join(Score, User.id == Score.user_id)
            .order_by(Score.score.asc())  # Change to ascending order
            .limit(20)
            .all()
        )

        # Convert the result to a list of dictionaries
        result = [{'username': username, 'score': score} for username, score in top_scores]
        return jsonify({'score': result})

    return jsonify([])

            # Check if the player score is greater than 0
            
                     
           





#checking is 100 players in queue
connections_list = []
@socketio.on('cookie_message')
def handle_cookie_message(data):
    user_id = data['cookie']
    print(f'Client connected with user_id: {user_id}')
    if user_id not in connections_list:
        connections_list.append(user_id)
        print('Updated connections_list:', connections_list)

    numberOfJoinedPlayers = len(connections_list)
    if len(connections_list) > 0:
        socketio.emit('start_status', {'start': 'true', 'joinedPlayers': numberOfJoinedPlayers})
    else:
        socketio.emit('start_status', {'start': 'wait', 'joinedPlayers': numberOfJoinedPlayers})



@socketio.on('disconnect')
def handle_disconnect():
    user_id = request.args.get('user_id')
    print(f'Client disconnected with user_id: {user_id}')
    
    if user_id in connections_list:
        connections_list.remove(user_id)
#saving user response in DB
@app.route('/comment', methods=['GET'])
def saving_reply():
    comment_data = json.loads(request.args.get('data'))
    print(comment_data)
    
    user_id_from_cookie = request.cookies.get('user_id')
    
    if user_id_from_cookie:
        user = User.query.get(int(user_id_from_cookie))
        if user:
            new_comment = Comment(text=comment_data['text'], user_id=user.id)
            
            try:
                db.session.add(new_comment)
                db.session.commit()
                return jsonify({'status':'Message Sent'})
            except Exception as e:
                db.session.rollback()
                return jsonify({'status':'error'})
        else:
            return render_template('register.html')
    else:
        return render_template('register.html')
    
passKey = '123'  ##Enter Your Desire Password Here

#Your Admin Panel check how many users are playing, players rank and all about them
@app.route('/admin')
def renderAdmin():
    return render_template('admin_login.html')  

@app.route('/admin_auth', methods=['POST'])
def sendAlldata():
    password = request.form.get('pw')
    if password ==  passKey:
        all_users = User.query.all()
        all_comments = Comment.query.all()

        return render_template('dashboard.html', users=all_users, comments=all_comments, user_scores=user_scores, connections_list=connections_list)
    else:
        return render_template('admin_login.html')

#Deleting the whole data here. remember this will delete whole database
@app.route('/deleteAll', methods=['GET'])
def dropDB():
    data = json.loads(request.args.get('key'))
    if data['key'] == passKey:
        try:
            # User.query.delete()
            # Comment.query.delete()
            Score.query.delete()
            db.session.commit()
            print("All data deleted successfully.")
            return jsonify({'msg': 'done'})
        except Exception as e:
            db.session.rollback()
            print(f"Error deleting data: {str(e)}")
            return jsonify({'msg': 'error'})
        finally:
            db.session.close()
    else:
        return render_template('admin_login.html')

@app.route('/leaveServer', methods=['GET'])
def leaveServer():
    user_id = request.args.get('user')
    print('hello')
    if user_id and user_id in connections_list:
        connections_list.remove(user_id)
        numberOfJoinedPlayers = len(connections_list)

        return jsonify({'status': 'success', 'joinedPlayers': numberOfJoinedPlayers})
    else:
        return jsonify({'status': 'error', 'message': 'User ID not found in connections_list'})\
        

@app.route('/unload', methods=['POST'])
def handle_unload():
    global received_data
    data = request.json
    received_data = data
    print('Received data from client:', data)
    return {'message': 'Data received successfully'}
   

"""with app.app_context():
    db.create_all()"""
if __name__ == '__main__':
      socketio.run(app, debug=True)
    


