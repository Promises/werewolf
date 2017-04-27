package com.werewolf.services;

import com.werewolf.data.GameEntityRepository;
import com.werewolf.data.JoinGameForm;
import com.werewolf.data.LobbyEntityRepository;
import com.werewolf.entities.GameEntity;
import com.werewolf.entities.GamePlayer;
import com.werewolf.entities.LobbyEntity;
import com.werewolf.entities.LobbyPlayer;
import com.werewolf.gameplay.ChaoticEvil;
import com.werewolf.gameplay.EmulationCharacter;
import com.werewolf.gameplay.Evil;
import com.werewolf.gameplay.Neutral;
import com.werewolf.gameplay.NeutralEvil;
import com.werewolf.gameplay.RoleInterface;
import com.werewolf.gameplay.Good;
import com.werewolf.gameplay.roles.Amnesiac;
import com.werewolf.gameplay.roles.Bandit;
import com.werewolf.gameplay.roles.Bard;
import com.werewolf.gameplay.roles.Marauder;
import com.werewolf.gameplay.roles.Guard;
import com.werewolf.gameplay.roles.Inquisitor;
import com.werewolf.gameplay.roles.Jester;
import com.werewolf.gameplay.roles.King;
import com.werewolf.gameplay.roles.Knight;
import com.werewolf.gameplay.roles.Priest;

import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Set;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Repository
public class JoinGameServiceImpl implements JoinGameService {

	private final HashMap<String, HashMap<Long, EmulationCharacter>> gameMap = new HashMap<>();

	@Autowired
	GameEntityRepository gameEntityRepository;

	@Autowired
	LobbyEntityRepository lobbyEntityRepository;

	// Assumes that there are no games with given id
	@Override
	public void create(LobbyEntity lobbyEntity) {
		lobbyEntity.setStartedState(true);
		lobbyEntityRepository.save(lobbyEntity); // Make sure others can't join
													// while game initializes

		gameMap.put(lobbyEntity.getGameId(), new HashMap<>());
		
		GameEntity gameEntity = new GameEntity();
		gameEntity.setGameid(lobbyEntity.getGameId());
		gameEntity.setAlivePlayers(createPlayers(lobbyEntity.getPlayers(), gameEntity));
		gameEntityRepository.save(gameEntity);
	}

	@Override
	public GameEntity findByGameId(String gameId) {
		return gameEntityRepository.findByGameid(gameId)
				.orElseThrow(() -> new IllegalArgumentException("A game with gameid: " + gameId + " does not exist"));
	}

	@Override
	@Transactional
	public GameEntity findById(long id) {
		GameEntity game = gameEntityRepository.findOne(id);
		if (game != null)
			return game;
		else {
			throw new IllegalArgumentException("A lobby with that id does not exist");
		}
	}

	@Override
	public JoinGameForm getEditForm(GameEntity gameEntity) {
		JoinGameForm joinGameForm = new JoinGameForm();
		joinGameForm.setGameId(gameEntity.getGameId());
		return joinGameForm;
	}

	@Override
	public boolean gameidIsPresent(String gameid) {
		return gameEntityRepository.findByGameid(gameid).isPresent();
	}

	private List<GamePlayer> createPlayers(Set<LobbyPlayer> lobbyPlayers, GameEntity gameEntity) {
		List<GamePlayer> gamePlayers = new ArrayList<>();
		List<RoleInterface> lottery = new ArrayList<>();
		int size = lobbyPlayers.size();
		switch (size) {
		case 15:
			lottery.add(new Bard());
		case 14:
			lottery.add(ChaoticEvil.getRandomChaoticEvil());
		case 13:
			lottery.add(new Guard());
		case 12:
			lottery.add(new Inquisitor());
		case 11:
			lottery.add(Neutral.getRandomNeutral());
		case 10:
			lottery.add(new Knight());
		case 9:
			lottery.add(RoleInterface.getRandomRole());
		case 8:
			lottery.add(Evil.getRandomEvil());
		case 7:
			lottery.add(new Marauder());
			lottery.add(new Bandit());
			lottery.add(NeutralEvil.getRandomNeutralEvil());
			lottery.add(Good.getRandomGood());
			lottery.add(new Priest());
			lottery.add(new Inquisitor());
			lottery.add(new King());
			break;
		case 6:
			lottery.add(new Marauder());
			lottery.add(new Bandit());
			lottery.add(RoleInterface.getRandomRole());
			lottery.add(Good.getRandomGood());
			lottery.add(new Inquisitor());
			lottery.add(new King());
			break;
		case 5:
			lottery.add(new Marauder());
			lottery.add(new Bandit());
			lottery.add(Good.getRandomGood());
			lottery.add(new Amnesiac());
			lottery.add(new King());
			break;
		case 4:
			lottery.add(new Marauder());
			lottery.add(new Jester());
			lottery.add(new Priest());
			lottery.add(new King());
			break;
		}

		for (LobbyPlayer lobbyPlayer : lobbyPlayers) {
			SecureRandom random = new SecureRandom();
			int rng = random.nextInt(lottery.size());
			RoleInterface role = lottery.get(rng);
			lottery.remove(rng);

			GamePlayer player = new GamePlayer();
			player.setNickname(lobbyPlayer.getNickname());
			player.setUser(lobbyPlayer.getUser());
			player.setGame(gameEntity);
			gameMap.get(gameEntity.getGameId()).put(player.getId(), new EmulationCharacter(player.getId(), role));
		}
		
		return gamePlayers;
	}
}
