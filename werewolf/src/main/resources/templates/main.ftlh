<#import "websocketmaster.ftlh" as m/>
<@m.master>
<div id="menu">
    <nav class="custom-nav">
        <ul>
            <li id="profileref" class="active"><span onClick="loadProfile()">Profile</span></li>
            <li id="openlobbyref"><span onClick="loadOpenLobby()">Lobby</span></li>
            <li class="custom-nav-right custom-nav-text">User: <b>${username}</b></li>
        </ul>
    </nav>
    <div class="container" style="padding-top:20px">
        <div class="row">
            <div class="col-md-4 col-md-offset-8">
                <div id="profilediv" class="show">
                    <ul class="list-group list-unstyled" style="text-align: left;color: #aaa;">
                        <li class="list-group-item profile-list">
                            <span class="medieval-text">Username: <span id="profilename"></span></span>
                        </li>
                        <li class="list-group-item profile-list">
                            <span class="medieval-text">Games: <span id="profilegames"></span></span>
                        </li>
                        <li class="list-group-item profile-list">
                            <span class="medieval-text">Wins: <span id="profilewins"></span></span>
                        </li>
                        <li class="list-group-item profile-list">
                            <span class="medieval-text">Losses: <span id="profilelosses"></span></span>
                        </li>
                        <li class="list-group-item profile-list">
                            <span class="medieval-text">Win Rate: <span id="profilewinrate"></span></span>
                        </li>
                    </ul>
                    <!-- <div class="profile-border"> </div>-->

                </div>
            </div>
        </div>
        <div id="openlobbydiv" class="hide">
            <div class="form-group">
                <div class="absolute-center">
                    <form role="form" class="form-horizontal" onsubmit="submitJoinLobbyForm(); return false;"
                          id="joinLobbyForm" name="joinLobbyForm">
                        <div id="nicknamediv" class="form-group">
                            <input id="nicknamefield" name="nickname" type="text" placeholder="Nickname"
                                   class="form-control" maxlength="16" autocomplete="off" autofocus>
                            <span id="nicknameglyph"></span>
                        </div>
                        <dd class="text-muted">- leave game ID empty to create a new lobby -</dd>
                        <div id="gameiddiv" class="form-group">
                            <input id="gameidfield" name="gameid" type="text" placeholder="Game ID" class="form-control"
                                   autocomplete="off" pattern="[A-Za-z0-9]{5}">
                            <span id="gameidglyph"></span>
                        </div>
                        <button id="joinbutton" name="joinbutton" class="btn btn-info">Join</button>
                    </form>
                </div>
            </div>
            <table class="table table-condensed custom-table-striped">
                <thead>
                <tr>
                    <th class="text-center">Lobby Code</th>
                    <th class="text-center">Players</th>
                </tr>
                </thead>
                <tbody id="lobbytable">
                </tbody>
            </table>
        </div>
    </div>
</div>
<div id="lobby" class="hide">
    <nav class="custom-nav">
        <ul>
            <li id="lobbyref" class="active"><span onclick="loadLobby()">Lobby</span></li>
            <li id="optionsref"><span onclick="loadOptions()">Options</span></li>
        </ul>
    </nav>
    <div id="lobbydiv" class="show">
        <div class="container">
            <div class="page-header">
                <h1>Lobby code: <b id="gamecodenode" class="text-primary"></b></h1>
            </div>
            <ul id="plist" class="list-group"></ul>
            <button id="btnready" class="btn btn-success btn-block" onclick="changeReadyState()">Ready (0/4)</button>
        </div>
    </div>
    <div id="optionsdiv" class="hide"></div>
</div>
<div id="game" class="hide">
    <div class="phase-div">
        <img id="dayphase" src="css/img/Werewolf-Day.png" class="phase phase-out">
        <img id="nightphase" src="css/img/Werewolf-Night.png" class="phase phase-out">
        <img id="deadphase" src="css/img/Werewolf-Dead.png" class="phase phase-out">
        <img id="wonphase" src="css/img/Werewolf-Won.png" class="phase phase-out">
        <img id="lostphase" src="css/img/Werewolf-Lost.png" class="phase phase-out">
    </div>
    <nav class="custom-nav">
        <ul>
            <li><span id="actionref" onclick="loadAction()">Action</span></li>
            <li><span id="logref" onclick="loadLog()">Log</span></li>
            <li><span id="graveref" onclick="loadGraveyard()">Graveyard</span></li>
            <li><span id="roleref" onclick="showRole()">Role</span></li>
        </ul>
    </nav>
    <div id="actiondiv" class="show">
        <div id="dayactiondiv" class="hide">
            <div class="container">
                <table class="table table-condensed">
                    <thead>
                    <tr>
                        <th class="text-center col-xs-6">Name</th>
                        <th class="text-center col-xs-3">Lynch</th>
                    </tr>
                    </thead>
                    <tbody id="votelist"></tbody>
                </table>
            </div>
        </div>
        <div id="nightactiondiv" class="hide">
            <div class="container">
                <table class="table table-condensed">
                    <thead>
                    <tr>
                        <th class="text-center col-xs-6">Name</th>
                        <th class="text-center col-xs-3">Action</th>
                    </tr>
                    </thead>
                    <tbody id="nightactionlist"></tbody>
                </table>
            </div>
        </div>
        <div id="noactiondiv" class="show"></div>
    </div>
    <div id="logdiv" class="hide">
        <div id="loglist" class="container"></div>
    </div>
    <div id="gravediv" class="hide">
        <div class="container">
            <table class="table table-condensed">
                <thead>
                <tr>
                    <th class="text-center col-xs-6">Name</th>
                    <th class="text-center col-xs-3">Role</th>
                </tr>
                </thead>
                <tbody id="gravelist"></tbody>
            </table>
        </div>
    </div>
    <div id="rolediv" class="hide">
        <div class="container">
            <h1 class="panel-title"><b id="rolename"></b></h1>
            <table id="roletable" class="table table-condensed"></table>
        </div>
    </div>
    <!-- Modal -->
    <div id="rolemodal" class="modal fade" tabindex="-1" role="dialog">
        <div class="modal-dialog">
            <div class="modal-content">
                <!-- Modal Header -->
                <div class="modal-header">
                    <button type="button" class="close" data-dismiss="modal">
                        <span aria-hidden="true">&times;</span>
                        <span class="sr-only">Close</span>
                    </button>
                    <h4 id="modalrolename" class="modal-title">Role</h4>
                </div>

                <!-- Modal Body -->
                <div class="modal-body">
                    <div class="row">
                        <div class="col-xs-5 col-sm-3">
                            <ul id="goodrolelist" class="nav nav-pills nav-stacked"></ul>
                            <ul id="neutralrolelist" class="nav nav-pills nav-stacked"></ul>
                            <ul id="evilrolelist" class="nav nav-pills nav-stacked"></ul>
                        </div>
                        <div class="col-xs-7 col-sm-9">
                            <div class="row">
                                <p class="text-left" id="modalalignment"></p></div>
                            <div class="row">
                                <p class="text-left" id="modalgoal"></p></div>
                            <div class="row">
                                <p class="text-left" id="modaldescription" style="width: auto;"></p></div>
                        </div>
                    </div>
                </div>

                <!-- Modal Footer -->
                <div class="modal-footer">
                    <button type="button" class="center-block btn btn-default" data-dismiss="modal">Close</button>
                </div>
            </div>
        </div>
    </div>
</@m.master>