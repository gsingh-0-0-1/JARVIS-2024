from flask import Flask
from flask import render_template
import requests

app = Flask(__name__)

TSS_ADDR = '192.168.86.54'
TSS_PORT = 14141

LMCC_ADDR = '0.0.0.0'
LMCC_PORT = 8000

@app.route('/')
def main():
	return render_template('main.html')

@app.route('/tss_info')
def tss_info():
	return '{"addr" : "%s", "port" : "%d"}' % (TSS_ADDR, TSS_PORT)

@app.route('/telemetry')
def telemetry():
	req = requests.get("http://%s:%d/json_data/teams/7/TELEMETRY.json" % (TSS_ADDR, TSS_PORT))
	return req.text

#@app.route('/<path:item>')
#def handle_template(item):
#    return render_template(item + '.html')

app.run(host = LMCC_ADDR, port = LMCC_PORT, debug = True)

print("LMCC is running on %s:%d" % (LMCC_ADDR, LMCC_PORT))

