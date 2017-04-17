package com.werewolf.entities;

import javax.persistence.*;

@Entity
public class LobbyPlayer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false, updatable = true)
    private long id;

    @Column(name = "nickname", nullable = false, updatable = true)
    private String nickname;

    @ManyToOne
    @JoinColumn(name = "lobby_lobbyplayers")
    LobbyEntity lobby;

    @OneToOne
    @JoinTable(name = "lobbyplayer_user", joinColumns = @JoinColumn(name = "lobbyplayer_nickname"), inverseJoinColumns = @JoinColumn(name = "user_id"))
    private User user;

    public void setNickname(String nickname) {
        this.nickname = nickname;
    }

    public void setLobby(LobbyEntity lobby) { this.lobby = lobby; }

    public void setUser(User user) {
        this.user = user;
    }

    public long getId() { return id; }

    public String getNickname() {
        return nickname;
    }

    public LobbyEntity getLobby() { return lobby; }

    public User getUser() {
        return user;
    }
}
