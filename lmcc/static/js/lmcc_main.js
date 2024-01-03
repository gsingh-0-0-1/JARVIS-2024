var TSS_ADDR = null;
var TSS_PORT = null;

var key_field_bindings = {}

function bindFieldtoKey(field, key) {
	key_field_bindings[field] = key;
}


function updateData() {
	var req = new XMLHttpRequest();
	req.open('GET', '/telemetry')
	req.onreadystatechange = function () {
		if (this.readyState == 4 && this.status == 200) {
			var responseJSON = JSON.parse(this.responseText)
			for (var field of Object.keys(key_field_bindings)) {
				var telemetry_key = key_field_bindings[field]
				if (telemetry_key == 'eva_time') {
					document.getElementById(field).textContent = responseJSON['telemetry']['eva_time']
				}
				else {
					var full_key = telemetry_key.split("/")
					var eva = full_key[0]
					var target_key = full_key[1]
					document.getElementById(field).textContent = responseJSON['eva' + eva][target_key]
				}
				//document.getElementById(field).textContent = responseJSON[]
			}

			setTimeout(updateData, 400)
		}
	}
	req.send()
}

function fetchTSSEndpoint() {
	var req = new XMLHttpRequest();
	req.open('GET', '/tss_info')
	req.onreadystatechange = function () {
		if (this.readyState == 4 && this.status == 200) {
			var responseJSON = JSON.parse(this.responseText)
			TSS_ADDR = responseJSON['addr']
			TSS_PORT = responseJSON['port']
			updateData();
		}
	}
	req.send()
}

bindFieldtoKey('running_timer_eva', 'eva_time')
