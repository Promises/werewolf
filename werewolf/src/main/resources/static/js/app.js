var stompClient = null;
navigator.vibrate = navigator.vibrate || navigator.webkitVibrate || navigator.mozVibrate || navigator.msVibrate;
var playerlist = {}; // Initialize an empty object that will contain players
var deadplayers = {};
var aliveplayers = {};
var invalidtargets = {};
var openlobbies = {};
var rolelist = {};
var role = null; // Name of the user's role
var viewrole = null; // Currently viewed role
var gamecode = null;
var ready = false; // Player is not ready upon load
var voted = null;
var nightact = null;
var owner = null; // ID of the user
var phase = null;
var alive = true;
var error = null;

if(!window.WebSocket) {
    var notSupported = document.createElement("b");
    var noweb = document.getElementById("nowebsocket");
    notSupported.setAttribute("class", "text-danger");
    notSupported.innerHTML = "ERROR: You do not support websockets!";
    noweb.appendChild(notSupported);
}

//getOpenLobbies();
getProfile();
initializeWebsocket();

function initializeWebsocket() {
    var socket = new SockJS('/werewolf-websocket');
    stompClient = Stomp.over(socket);
    connectoAndSubscribeToPrivate()
}

function connectoAndSubscribeToPrivate() {
    stompClient.connect({}, function (frame) {
        console.log('Connected: ' + frame);
        stompClient.subscribe('/user/action/private', function (messageOutput) {
            receivePrivateMessage(JSON.parse(messageOutput.body));
        });
        stompClient.subscribe('/action/broadcast/public', function (messageOutput) {
            receivePrivateMessage(JSON.parse(messageOutput.body));
        });
        sendPrivateMessage({"action":"getopenlobbies"});
    });
}

function subscribeToBroadcast() {
    stompClient.subscribe('/action/broadcast/' + gamecode, function (messageOutput) {
        receiveBroadcastMessage(JSON.parse(messageOutput.body));
    });
    sendPrivateMessage({"action":"getplayers"});
}

// Runs when client connects to messagebroker
function connect() {
    var socket = new SockJS('/werewolf-websocket');
    stompClient = Stomp.over(socket);
    stompClient.connect({}, function (frame) {
        stompClient.subscribe('/action/broadcast/' + gamecode, function (messageOutput) {
            receiveBroadcastMessage(JSON.parse(messageOutput.body));
        });
        stompClient.subscribe('/user/action/private', function (messageOutput) {
            receivePrivateMessage(JSON.parse(messageOutput.body));
        });
        setConnected(true);
    });
}

// Runs when client disconnects from messagebroker
function disconnect() {
    if (stompClient != null) {
        stompClient.disconnect();
    }
    setConnected(false);
    console.log("Disconnected");
}

function broadcastMessage(message) {
    stompClient.send('/app/broadcast/' + gamecode, {}, JSON.stringify(message));
}

function sendPrivateMessage(message) {
    stompClient.send('/app/private', {}, JSON.stringify(message));
}

function receiveBroadcastMessage(message) {
    for(var i = 0; i < message.length; i++) {
            var action = message[i].action;
            
            switch(action) {
            	case "waitphase":
            		waitPhase();
            	break;
            	case "dayphase":
            		dayPhase();
            		break;
            	case "nightphase":
            		nightPhase();
            		break;
                case "join":
                    addPlayer(message[i].playerid, message[i].info);
                    break;
                case "updatevotestatus":
                	someoneVoted(message[i].playerid, message[i].info, message[i].additionalinfo, message[i].variable);
                	break;
                case "updatereadystatus":
                	someoneClickedReady(message[i].playerid, message[i].info, message[i].additionalinfo);
                	break;
                case "kinglynch":
                	lynchPlayer(message[i].playerid, message[i].info, message[i].additionalinfo, message[i].variable, true);
                	break;
                case "lynch":
                	lynchPlayer(message[i].playerid, message[i].info, message[i].additionalinfo, message[i].variable, false);
                	break;
                case "kill":
                	killPlayer(message[i].playerid, message[i].info, message[i].additionalinfo, message[i].variable, false);
                	break;
                case "jesterkill":
                	killPlayer(message[i].playerid, message[i].info, message[i].additionalinfo, message[i].variable, true);
                	break;
                case "leave":
                	removePlayer(message[i].playerid, message[i].info);
                    break;
                case "lobbyready":
                	loadGame();
                	break;
                case "addtorolelist":
                    addToRoleList(message[i].playerid, message[i].info, message[i].additionalinfo, message[i].variable);
                	break;
                default:
                    break;
            }
    }
}

function receivePrivateMessage(message) {
    for(var i = 0; i < message.length; i++) {
            var action = message[i].action;
            
            switch(action) {
            	case "nightaction":
            		updateNightAction(message[i].info, true);
            		break;
            	case "unnightaction":
            		updateNightAction(message[i].info, false);
            		break;
            	case "nightmessage":
                 	addToLog(message[i].info);
                 	break;
                case "join":
                    addPlayer(message[i].playerid, message[i].info);
                    break;
                case "addinvalidtarget":
                	addToInvalidTargets(message[i].playerid, message[i].info, message[i].additionalinfo);
                	break;
                case "joinalive":
                	addToActionList(message[i].playerid, message[i].info, message[i].additionalinfo);
                	break;
                case "joindead":
                	addToGraveyard(message[i].playerid, message[i].info, message[i].additionalinfo, message[i].variable);
                	break;
                case "lobby":
                	prepareLobby();
                	break;
                case "openlobby":
                    addToOpenLobby(message[i].playerid, message[i].info);
                    break;
                case "removeopenlobby":
                    removeOpenLobby(message[i].info);
                    break;
                case "lobbyready":
                	loadGame();
                	break;
                case "owner":
                	owner = message[i].playerid;
                	addPlayer(message[i].playerid, message[i].info);
                	document.getElementById(message[i].playerid).setAttribute("class", "list-group-item list-group-item-success");
                	break;
                case "won":
                	won();
                	break;
                case "lost":
                	lost();
                	break;
                case "initrole":
                    viewRole(message[i].info);
                    showRole();
                case "role":
                	setRole(message[i].info);
                	break;
                case "profile":
                    setProfile(message[i].playerid, message[i].info, message[i].additionalinfo);
                    break;
                default:
                    break;
            }
    }
}

function setProfile(username, wins, games) {
    var profilename = document.getElementById("profilename");
    var profilegames = document.getElementById("profilegames");
    var profilewins = document.getElementById("profilewins");
    var profilelosses = document.getElementById("profilelosses");
    var profilewinrate = document.getElementById("profilewinrate");

    var losses = games - wins;
    var winrate = 0;
    if(games != 0) {
        winrate = (100*games)/losses;
    }

    profilename.innerHTML = username;
    profilegames.innerHTML = games;
    profilewins.innerHTML = wins;
    profilelosses.innerHTML = losses;
    profilewinrate.innerHTML = winrate;
}

function submitJoinLobbyForm() {
    var nicknamefield = document.getElementById("nicknamefield");
    var gameidfield = document.getElementById("gameidfield");

    nicknamefield.disabled = true;
    gameidfield.disabled = true;
    joinLobby(nicknamefield.value, gameidfield.value);
}

function joinLobby(nickname, gameid) {
    $.ajax({
        url: '/lobby/joinlobbyrequest',
        type: "POST",
        datatype: 'json',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        data: JSON.stringify({"nickname":nickname, "gameid":gameid}),
        success: function(data) {
            joinLobbyReply(data);
        }
    });
}

function getProfile() {
    $.ajax({
        url: '/lobby/getprofile',
        type: "GET",
        datatype: 'json',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        success: function(data) {
            receivePrivateMessage(data);
        }
    });
}

function joinLobbyReply(message) {
    var gameiddiv = document.getElementById("gameiddiv");
    var gameidfield = document.getElementById("gameidfield");
    var gameidglyph = document.getElementById("gameidglyph");
    var nicknamediv = document.getElementById("nicknamediv");
    var nicknamefield = document.getElementById("nicknamefield");
    var nicknameglyph = document.getElementById("nicknameglyph");
    gameidfield.disabled = false;
    nicknamefield.disabled = false;
    gameiddiv.setAttribute("class", "form-group");
    gameidglyph.setAttribute("class", "");
    nicknamediv.setAttribute("class", "form-group");
    nicknameglyph.setAttribute("class", "");
    for(var i = 0; i < message.length; i++) {
        switch(message[i].action) {
            case "error":
                if(message[i].info === "404") {
                    gameiddiv.setAttribute("class", "form-group has-error has-feedback");
                    gameidglyph.setAttribute("class", "glyphicon glyphicon-remove form-control-feedback");
                }
                else if(message[i].info === "100") {
                    nicknamediv.setAttribute("class", "form-group has-error has-feedback");
                    nicknameglyph.setAttribute("class", "glyphicon glyphicon-remove form-control-feedback");
                }
                break;
            case "gamecode":
                gamecode = message[i].info;
                subscribeToBroadcast();
                document.getElementById("gamecodenode").innerHTML = gamecode;
                document.getElementById("menu").setAttribute("class", "hide");
                document.getElementById("lobby").setAttribute("class", "show");
                break;
            default:
                break;
        }
    }
}

function prepareLobby() {
	var lobby = document.getElementById("lobby");
	lobby.setAttribute("class", "show");
	broadcastMessage({"action":"join"});
}

function addToInvalidTargets(playerid, rolename, alignment) {
	if (!invalidtargets.hasOwnProperty(playerid)) {
		invalidtargets[playerid] = {"role":rolename, "alignment":alignment};
	}
}

function waitPhase() {
	phase = "wait";
	loadNoAction();
}

function dayPhase() {
	phase = "day";
	if ("vibrate" in navigator  && alive) {
		navigator.vibrate(500);
	}
	
	var elem = document.getElementById("dayphase");
	elem.setAttribute("class", "phase phase-in");
	phaseout(elem, 2);
	loadDayAction();
}

function lynchPlayer(playerid, playername, playerrole, alignment, kinged) {
	if(kinged) {
		addToLog(playerlist[playerid] + " executed by the king himself!");
	} else {
		addToLog(playerlist[playerid] + " was lynched by an angry mob!");
	}
	addToGraveyard(playerid, playername, playerrole, alignment);
}

function dead() {
	alive = false;
	
	if ("vibrate" in navigator) {
		navigator.vibrate(500);
	}
	
	var elem = document.getElementById("deadphase");
	elem.setAttribute("class", "phase phase-in");
	phaseout(elem, 2);
}

function won() {
	var elem = document.getElementById("wonphase");
	elem.setAttribute("class", "phase phase-in");
}

function lost() {
	var elem = document.getElementById("lostphase");
	elem.setAttribute("class", "phase phase-in");
}

function nightPhase() {
	phase = "night";
	if ("vibrate" in navigator && alive) {
		navigator.vibrate(500);
	}
	
	var elem = document.getElementById("nightphase");
	elem.setAttribute("class", "phase phase-in");
	phaseout(elem, 2);
	loadNightAction();
}

function phaseout(elem, delay) {
	setTimeout(function() {elem.setAttribute("class", "phase phase-out"); }, delay*1000);
}

function killPlayer(playerid, playername, playerrole, alignment, jester) {
	if(playerid == owner)
		dead();
	
	if(jester) {
		addToLog(playername + " was haunted to death by a jester.");
	} else {
		addToLog(playername + " was murdered during the deepest, darkest hours of the night.");
	}
	addToGraveyard(playerid, playername, playerrole, alignment);
}

function addToActionList(playerid, playername, votes) {
	if (!aliveplayers.hasOwnProperty(playerid)) {
		if(deadplayers.hasOwnProperty(playerid)) {
			removeFromGraveyard(playerid);
		}
		
		aliveplayers[playerid] = {"name":playername, "votes":votes};
		
		var votelist = document.getElementById("votelist");
		var voterow = document.createElement("tr");
		var votename = document.createElement("th");
		var vote = document.createElement("th");
		var votebtn;
		votename.innerHTML = playername;
		votename.setAttribute("class", "text-center");
		voterow.setAttribute("id", "av" + playerid);
		if(playerid == owner) {
			votebtn = document.createElement("b");
			votebtn.innerHTML = votes;
			votebtn.setAttribute("id", "vb" + playerid);
			votebtn.setAttribute("class", "text-center center-block");
		} else {
			votebtn = document.createElement("button");
			votebtn.innerHTML = "Vote(" + votes + ")";
			votebtn.setAttribute("id", "vb" + playerid);
			votebtn.setAttribute("class", "btn btn-info btn-block");
			votebtn.setAttribute("onclick", "voteon(" + playerid + ")");
		}
		vote.appendChild(votebtn);
		voterow.appendChild(votename);
		voterow.appendChild(vote);
		votelist.appendChild(voterow);
		
		var nightlist = document.getElementById("nightactionlist");
		var nightrow = document.createElement("tr");
		var nightname = document.createElement("th");
		var night = document.createElement("th");
		var nightbtn;
		nightname.innerHTML = playername;
		nightname.setAttribute("class", "text-center");
		nightrow.setAttribute("id", "an" + playerid);
		if(playerid != owner) {
			if (!invalidtargets.hasOwnProperty(playerid)) {
				nightbtn = document.createElement("button");
				nightbtn.setAttribute("id", "ab" + playerid);
				nightbtn.setAttribute("class", "btn btn-night btn-nightact btn-block");
				nightbtn.setAttribute("onclick", "nightaction(" + playerid + ")");
				night.appendChild(nightbtn);
			} else {
				nightbtn = document.createElement("b");
				nightbtn.setAttribute("id", "ab" + playerid);
				nightbtn.setAttribute("class", "text-center center-block text-info");
				nightbtn.innerHTML = "Ally";
				night.appendChild(nightbtn);
			}
		} else {
			nightbtn = document.createElement("b");
			nightbtn.setAttribute("id", "ab" + playerid);
			nightbtn.setAttribute("class", "text-center center-block text-success");
			nightbtn.innerHTML = "Yourself";
			night.appendChild(nightbtn);
		}
		nightrow.appendChild(nightname);
		nightrow.appendChild(night);
		nightlist.appendChild(nightrow);
	}
}

function removeFromActionList(playerid) {
	if (aliveplayers.hasOwnProperty(playerid)) {
		delete aliveplayers[playerid];
		document.getElementById("av" + playerid).remove();
		document.getElementById("an" + playerid).remove();
	}
}

function addToLog(message) {
	var loglist = document.getElementById("loglist");
	var msg = document.createElement("div");
	msg.innerHTML = message;
	loglist.appendChild(msg);
}

function addToGraveyard(playerid, playername, playerrole, alignment) {
	if (!deadplayers.hasOwnProperty(playerid)) {
		if(aliveplayers.hasOwnProperty(playerid)) {
			removeFromActionList(playerid);
		}
		
		deadplayers[playerid] = {"name":playername, "role":playerrole};
		var gravelist = document.getElementById("gravelist");
		var row = document.createElement("tr");
		var name = document.createElement("th");
		var role = document.createElement("th");
		name.innerHTML = playername;
		row.setAttribute("id", "g" + playerid);
		role.innerHTML = playerrole;
    	switch(alignment) {
    	case "Good":
    		name.setAttribute("class", "text-center label-success");
    		role.setAttribute("class", "text-center label-success");
    		break;
    	case "Chaotic Good":
    		name.setAttribute("class", "text-center label-success");
			role.setAttribute("class", "text-center label-success");
    		break;
    	case "Evil":
    		name.setAttribute("class", "text-center label-danger");
			role.setAttribute("class", "text-center label-danger");
    		break;
    	case "Chaotic Evil":
    		name.setAttribute("class", "text-center label-danger");
			role.setAttribute("class", "text-center label-danger");
    		break;
    	case "Neutral":
    		name.setAttribute("class", "text-center");
			role.setAttribute("class", "text-center");
    		break;
    	case "Neutral Evil":
    		name.setAttribute("class", "text-center label-warning");
			role.setAttribute("class", "text-center label-warning");
    		break;
    	default:
    		name.setAttribute("class", "text-center");
			role.setAttribute("class", "text-center");
    		break;
    	}
    	row.appendChild(name);
    	row.appendChild(role);
    	gravelist.appendChild(row);
	}
}

function addToOpenLobby(lobbycode, players) {
	if(openlobbies.hasOwnProperty(lobbycode)) {
        var lobbyplayersfield = document.getElementById("olp" + lobbycode);
        lobbyplayersfield.innerHTML = players + '/20';
	} else {
		openlobbies[lobbycode] = players;
		var lobbytable = document.getElementById("lobbytable");
		var row = document.createElement("tr");
		var lobbycodefield = document.createElement("th");
		var lobbyplayersfield = document.createElement("th");
		lobbyplayersfield.setAttribute("id", "olp" + lobbycode);
		lobbycodefield.setAttribute("class", "text-center");
        lobbyplayersfield.setAttribute("class", "text-center");
		lobbycodefield.innerHTML = lobbycode;
		lobbyplayersfield.innerHTML = players + '/20';
		row.setAttribute("id", "l" + lobbycode);
		row.setAttribute("onClick", "setLobby(" + "'" + lobbycode + "'" + ")");
    	row.appendChild(lobbycodefield);
    	row.appendChild(lobbyplayersfield);
    	lobbytable.appendChild(row);
	}
}

function removeOpenLobby(lobbycode) {
    if(openlobbies.hasOwnProperty(lobbycode)) {
        delete openlobbies[lobbycode];
        document.getElementById("l" + lobbycode).remove();
    }
}

function setLobby(lobbycode) {
    document.getElementById("gameidfield").value = lobbycode;
    document.getElementById("nicknamefield").focus();
}

function removeFromGraveyard(playerid) {
	if(deadplayers.hasOwnProperty(playerid)) {
		delete deadplayers[playerid];
		document.getElementById("g" + playerid).remove();
	}
}

function addPlayer(playerid, nickname) {
	if (!playerlist.hasOwnProperty(playerid)) {
		playerlist[playerid] = nickname;
		var player = document.createElement("li");
    	var text = document.createTextNode(nickname);
    	player.appendChild(text);
    	player.setAttribute("id", playerid);
    	player.setAttribute("class", "list-group-item list-group-item-default");
    	document.getElementById("plist").appendChild(player);
	}
}

function removePlayer(playerid, nickname) {
	if(playerlist.hasOwnProperty(playerid)) {
		delete playerlist[playerid];
		document.getElementById(playerid).remove();
	}
}

function changeReadyState() {
	ready = !ready;
	document.getElementById("btnready").disabled = true;
	if(ready) {
		broadcastMessage({"action":"ready"});
	}else{
		broadcastMessage({"action":"unready"});
	}
}

function someoneClickedReady(playerid, readyplayercount, lobbyplayercount) {
	var elem = document.getElementById("btnready");
	if(playerid === owner) {
		elem.disabled = false;
		if(ready) {
			elem.setAttribute("class", "btn btn-danger btn-block");
		} else {
			elem.setAttribute("class", "btn btn-success btn-block");
		}
	}
	if(ready) {
		elem.innerHTML = "Unready (" + readyplayercount + "/" + Math.max(lobbyplayercount, 4) + ")";
	} else {
		elem.innerHTML = "Ready (" + readyplayercount + "/" + Math.max(lobbyplayercount, 4) + ")";
	}
}

function loadProfile() {
	var profileref = document.getElementById("profileref");
	var profilediv = document.getElementById("profilediv");
	var openlobbyref = document.getElementById("openlobbyref");
	var openlobbydiv = document.getElementById("openlobbydiv");
	profileref.setAttribute("class", "active");
	profilediv.setAttribute("class", "show");
	openlobbyref.setAttribute("class", "");
	openlobbydiv.setAttribute("class", "hide");
}

function loadOpenLobby() {
	var profileref = document.getElementById("profileref");
	var profilediv = document.getElementById("profilediv");
	var openlobbyref = document.getElementById("openlobbyref");
	var openlobbydiv = document.getElementById("openlobbydiv");
	profileref.setAttribute("class", "");
	profilediv.setAttribute("class", "hide");
	openlobbyref.setAttribute("class", "active");
	openlobbydiv.setAttribute("class", "show");

	document.getElementById("nicknamefield").focus();
}

function loadLobby() {
	var lobbyref = document.getElementById("lobbyref");
	var lobbydiv = document.getElementById("lobbydiv");
	var optionsref = document.getElementById("optionsref");
	var optionsdiv = document.getElementById("optionsdiv");
	lobbyref.setAttribute("class", "active");
	lobbydiv.setAttribute("class", "show");
	optionsref.setAttribute("class", "");
	optionsdiv.setAttribute("class", "hide");
}

function loadOptions() {
	var lobbyref = document.getElementById("lobbyref");
	var lobbydiv = document.getElementById("lobbydiv");
	var optionsref = document.getElementById("optionsref");
	var optionsdiv = document.getElementById("optionsdiv");
	lobbyref.setAttribute("class", "");
	lobbydiv.setAttribute("class", "hide");
	optionsref.setAttribute("class", "active");
	optionsdiv.setAttribute("class", "show");
}

function loadGame() {
	var lobby = document.getElementById("lobby");
	var game = document.getElementById("game");
	lobby.setAttribute("class", "hide");
	game.setAttribute("class", "show");
	sendPrivateMessage({"action":"initializegame"});
}

function voteon(playerid) {
	var votebtn = document.getElementById("vb" + playerid).disabled = true;
	
	if(voted == playerid) {
		broadcastMessage({"action":"unvote", "playerid":playerid});
		voted = null;
	} else {
		broadcastMessage({"action":"vote", "playerid":playerid});
	}
}

function nightaction(playerid) {
	var nightbtn = document.getElementById("ab" + playerid).disabled = true;
	
	if(nightact == playerid) {
		sendPrivateMessage({"action":"unnightaction", "playerid":playerid});
	} else {
		sendPrivateMessage({"action":"nightaction", "playerid":playerid});
	}
}

function updateNightAction(target, act) {
	var elem = document.getElementById("ab" + target);
	elem.disabled = false;
	
	if(act) {
		nightact = target;
		elem.setAttribute("class", "btn btn-night btn-default");
	} else {
		nightact = null;
		elem.setAttribute("class", "btn btn-night btn-nightact");
	}
}

function someoneVoted(playerid, votedon, votes, status) {
	if(aliveplayers.hasOwnProperty(playerid)) {
	var elem = document.getElementById("vb" + votedon);
	
	if(playerid === owner) {
		elem.disabled = false;
		
		if(status === "+") { // Means they voted on this player
			voted = votedon;
			elem.setAttribute("class", "btn btn-default btn-block");
			addToLog("You voted on " + playerlist[votedon]);
		} else if(status === "-") { // Means they removed their vote from this player			
			elem.setAttribute("class", "btn btn-info btn-block");
			addToLog("You removed your vote from " + playerlist[votedon]);
		} else if(status === "x") {
			voted = null;
			elem.setAttribute("class", "btn btn-info btn-block");
		}
	} else {
		if(status === "+") {
			addToLog(playerlist[playerid] + " has voted on " + playerlist[votedon]);
		} else if(status === "-") {
			addToLog(playerlist[playerid] + " has removed thier vote from " + playerlist[votedon]);
		}
	}
	
	if (votedon == owner) {
		elem.innerHTML = votes;
	} else if(votedon == voted) {
		elem.innerHTML = "Remove Vote(" + votes + ")";
	} else {
		elem.innerHTML = "Vote(" + votes + ")";
	}
	}
}

function loadAction() {
	if(phase === "night") {
		loadNightAction();
	}else if(phase === "day") {
		loadDayAction();
	}else {
		loadNoAction();
	}
	
	var actionref = document.getElementById("actionref");
	var actiondiv = document.getElementById("actiondiv");
	var logref = document.getElementById("logref");
	var logdiv = document.getElementById("logdiv");
	var graveref = document.getElementById("graveref");
	var gravediv = document.getElementById("gravediv");
	var roleref = document.getElementById("roleref");
	var rolediv = document.getElementById("rolediv");
	actionref.setAttribute("class", "active");
	actiondiv.setAttribute("class", "show");
	logref.setAttribute("class", "");
	logdiv.setAttribute("class", "hide");
	graveref.setAttribute("class", "");
	gravediv.setAttribute("class", "hide");
	roleref.setAttribute("class", "");
	rolediv.setAttribute("class", "hide");
}

function loadNightAction() {
	var nightdiv = document.getElementById("nightactiondiv");
	var daydiv = document.getElementById("dayactiondiv");
	var nodiv = document.getElementById("noactiondiv");
	nightdiv.setAttribute("class", "show");
	daydiv.setAttribute("class", "hide");
	nodiv.setAttribute("class", "hide");
}

function loadDayAction() {
	var nightdiv = document.getElementById("nightactiondiv");
	var daydiv = document.getElementById("dayactiondiv");
	var nodiv = document.getElementById("noactiondiv");
	nightdiv.setAttribute("class", "hide");
	daydiv.setAttribute("class", "show");
	nodiv.setAttribute("class", "hide");
}

function loadNoAction() {
	var nightdiv = document.getElementById("nightactiondiv");
	var daydiv = document.getElementById("dayactiondiv");
	var nodiv = document.getElementById("noactiondiv");
	nightdiv.setAttribute("class", "hide");
	daydiv.setAttribute("class", "hide");
	nodiv.setAttribute("class", "show");
}

function loadLog() {
	var actionref = document.getElementById("actionref");
	var actiondiv = document.getElementById("actiondiv");
	var logref = document.getElementById("logref");
	var logdiv = document.getElementById("logdiv");
	var graveref = document.getElementById("graveref");
	var gravediv = document.getElementById("gravediv");
	var roleref = document.getElementById("roleref");
	var rolediv = document.getElementById("rolediv");
	actionref.setAttribute("class", "");
	actiondiv.setAttribute("class", "hide");
	logref.setAttribute("class", "active");
	logdiv.setAttribute("class", "show");
	graveref.setAttribute("class", "");
	gravediv.setAttribute("class", "hide");
	roleref.setAttribute("class", "");
	rolediv.setAttribute("class", "hide");
}

function loadGraveyard() {
	var actionref = document.getElementById("actionref");
	var actiondiv = document.getElementById("actiondiv");
	var logref = document.getElementById("logref");
	var logdiv = document.getElementById("logdiv");
	var graveref = document.getElementById("graveref");
	var gravediv = document.getElementById("gravediv");
	var roleref = document.getElementById("roleref");
	var rolediv = document.getElementById("rolediv");
	actionref.setAttribute("class", "");
	actiondiv.setAttribute("class", "hide");
	logref.setAttribute("class", "");
	logdiv.setAttribute("class", "hide");
	graveref.setAttribute("class", "active");
	gravediv.setAttribute("class", "show");
	roleref.setAttribute("class", "");
	rolediv.setAttribute("class", "hide");
}

function loadRole() {
	var actionref = document.getElementById("actionref");
	var actiondiv = document.getElementById("actiondiv");
	var logref = document.getElementById("logref");
	var logdiv = document.getElementById("logdiv");
	var graveref = document.getElementById("graveref");
	var gravediv = document.getElementById("gravediv");
	var roleref = document.getElementById("roleref");
	var rolediv = document.getElementById("rolediv");
	actionref.setAttribute("class", "");
	actiondiv.setAttribute("class", "hide");
	logref.setAttribute("class", "");
	logdiv.setAttribute("class", "hide");
	graveref.setAttribute("class", "");
	gravediv.setAttribute("class", "hide");
	roleref.setAttribute("class", "active");
	rolediv.setAttribute("class", "show");
}

function addToRoleList(name, alignment, goal, description) {
    if(!rolelist.hasOwnProperty(name)) {
        rolelist[name] = {"alignment":alignment, "goal":goal, "description":description};

        var simplealignment = null;
        var alignmentcolor = null;
        switch(alignment) {
        	case "Good":
        		simplealignment = "good";
        		alignmentcolor = "text-success";
        		break;
        	case "Chaotic Good":
        		simplealignment = "good";
        		alignmentcolor = "text-success";
        		break;
        	case "Evil":
        		simplealignment = "evil";
        		alignmentcolor = "text-danger";
        		break;
        	case "Chaotic Evil":
        		simplealignment = "evil";
        		alignmentcolor = "text-danger";
        		break;
        	case "Neutral Evil":
        		simplealignment = "netrual";
        		alignmentcolor = "";
        		break;
        	case "Neutral":
        	    simplealignment = "neutral";
        	    alignmentcolor = "";
        	default:
        	    return;
        		break;
        	}

        var rlist = document.getElementById(simplealignment + "rolelist");
        var listelement = document.createElement("li");
        var listelementspan = document.createElement("span");

        listelement.setAttribute("id", "role." + name);
        listelementspan.setAttribute("onClick", "viewRole('" + name + "')");
        listelementspan.setAttribute("class", alignmentcolor);
        listelementspan.innerHTML = name;

        listelement.appendChild(listelementspan);
        rlist.appendChild(listelement);
    }
}

function showRole() {
    $('#rolemodal').modal('show');
}

function viewRole(name) {
    if(rolelist.hasOwnProperty(name)) {
        if(viewrole != null) {
            if(viewrole == role) {
                document.getElementById("role." + viewrole).setAttribute("class", "text-roleindicator");
            } else {
                document.getElementById("role." + viewrole).setAttribute("class", "");
            }
        }
        viewrole = name;

        if(viewrole == role) {
            document.getElementById("role." + viewrole).setAttribute("class", "active text-roleindicator");
        } else {
            document.getElementById("role." + viewrole).setAttribute("class", "active");
        }

        var rolename = document.getElementById("modalrolename");
        var rolealignment = document.getElementById("modalalignment");
        var rolegoal = document.getElementById("modalgoal");
        var roledescription = document.getElementById("modaldescription");

        var alignment = rolelist[name].alignment;
        var goal = rolelist[name].goal;
        var description = rolelist[name].description;

        rolename.innerHTML = name;
        rolealignment.innerHTML = alignment;
        rolegoal.innerHTML = goal;
        roledescription.innerHTML = description;

        switch(alignment) {
            case "Good":
        		rolealignment.setAttribute("class", "text-left text-success");
        		break;
        	case "Chaotic Good":
        		rolealignment.setAttribute("class", "text-left text-success");
        		break;
        	case "Evil":
        		rolealignment.setAttribute("class", "text-left text-danger");
        		break;
        	case "Chaotic Evil":
        		rolealignment.setAttribute("class", "text-left text-danger");
        		break;
        	case "Neutral Evil":
        		rolealignment.setAttribute("class", "text-left text-warning");
        		break;
        	case "Neutral":
        	default:
                break;
        }
    }
}

function setRole(name) {
    if(role != null) {
        var oldrole = document.getElementById("role." + role);
        if(viewerole == role) {
            oldrole.setAttribute("class", "active");
        } else {
            oldrole.setAttribute("class", "");
        }
    }

    role = name;
    var newrole = document.getElementById("role." + role);
    if(viewrole == role) {
        newrole.setAttribute("class", "active text-roleindicator");
    } else {
        newrole.setAttribute("class", "text-roleindicator");
    }
}

$(function () {
    var token = $("meta[name='_csrf']").attr("content");
    var header = $("meta[name='_csrf_header']").attr("content");
    $(document).ajaxSend(function(e, xhr, options) {
        xhr.setRequestHeader(header, token);
    });
});