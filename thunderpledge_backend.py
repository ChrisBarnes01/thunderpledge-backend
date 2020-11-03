from flask import Flask
app = Flask(__name__)

@app.route("/")
def hello():
    return "Hello World!"

@app.route("/pledge")
def pledge():
    return "I am pledging to this"

if __name__ == "__main__":
    app.run()
