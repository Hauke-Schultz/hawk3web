// German translation file
export default {
	// Allgemein/Häufig verwendet
	common: {
		ok: 'OK',
		cancel: 'Abbrechen',
		confirm: 'Bestätigen',
		delete: 'Löschen',
		save: 'Speichern',
		edit: 'Bearbeiten',
		back: 'Zurück',
		next: 'Weiter',
		previous: 'Zurück',
		close: 'Schließen',
		loading: 'Lädt...',
		error: 'Fehler',
		success: 'Erfolg',
		warning: 'Warnung',
		info: 'Info',
		yes: 'Ja',
		no: 'Nein',
		play: 'Spielen',
		pause: 'Pausieren',
		resume: 'Fortsetzen',
		reset: 'Zurücksetzen',
		restart: 'Neu starten',
		continue: 'Fortfahren',
		finish: 'Beenden',
		skip: 'Überspringen',
		unlock: 'Entsperren',
		lock: 'Sperren',
		locked: 'Gesperrt',
		unlocked: 'Entsperrt',
		level: 'Level',
		score: 'Punkte',
		high_score: 'Höchstpunktzahl',
		time: 'Zeit',
		moves: 'Züge',
		combo: 'Combo',
		complete: 'Abschließen',
		completed: 'Abgeschlossen',
		progress: 'Fortschritt',
		total: 'Gesamt',
		best: 'Beste',
		new: 'Neu',
		try_again: 'Nochmal versuchen',
		please_wait: 'Bitte warten...',
	},

	currency: {
		coins: 'Münzen',
		diamonds: 'Diamanten',
		earned: 'Verdient',
		spent: 'Ausgegeben',
		balance: 'Saldo',
		transaction: 'Transaktion',
		reward: 'Belohnung',
		achievement_reward: 'Erfolgs-Belohnung',
		level_reward: 'Level-Abschluss-Belohnung',
		combo_reward: 'Combo-Belohnung',
		daily_reward: 'Tägliche Belohnung'
	},

	rewards: {
		earned_rewards: 'Verdiente Belohnungen',
		level_completion: 'Level Abschluss',
		combo_bonus: 'Combo Bonus',
		perfect_bonus: 'Perfekt Bonus',
		total_earned: 'Gesamt verdient',
		achievement_reward: 'Erfolgs-Belohnung',
		breakdown: {
			title: 'Belohnungs-Aufschlüsselung',
			base_completion: 'Level-Abschluss',
			first_time_completion: 'Erstmals-Bonus',
			star_performance: '{stars}-Stern Leistung',
			perfect_performance: 'Perfekt-Leistungs-Bonus (+50%)',
			difficulty_multiplier: '{difficulty}: {multiplier}x Multiplikator',
			achievement_reward: 'Erfolg: {name}',
			endless_session: 'Endlos-Session',
			time_bonus: 'Zeit-Bonus ({minutes} Minuten)',
			merge_bonus: 'Merge-Bonus ({merges} Zusammenfügungen)',
		}
	},

	daily_rewards: {
		title: 'Claim your daily bonus!',
		tap_to_claim: 'Tap to claim',
		day_streak: 'Day Streak',
		streak_bonus: 'Streak Bonus',
		claimed_today: 'Already claimed today',
		come_back_tomorrow: 'Come back tomorrow!',
		reward_claimed: 'Daily reward claimed!',
		streak_maintained: 'Streak maintained: {streak} days',
		streak_broken: 'Streak reset - missed a day'
	},

	// App/Header
	app: {
		title: 'Hawk3',
		subtitle: 'Gaming Platform',
		welcome_back: 'Willkommen zurück!',
		ready_to_continue: 'Bereit, deine Reise fortzusetzen?'
	},

	// Navigation
	nav: {
		home: 'Start',
		gaming: 'Spiele',
		gaming_hub: 'Spiele',
		profile: 'Profil',
		shop: 'Shop',
		trophy: 'Trophäe',
		trophies: 'Trophäen',
		settings: 'Einstellungen',
		notifications: 'Benachrichtigungen',
		about: 'Über uns'
	},

	// Startseite
	home: {
		welcome_title: 'Willkommen zurück!',
		welcome_subtitle: 'Bereit, deine Reise fortzusetzen?',
		start_game: 'Spiel starten',
		gaming_hub: 'Spiele',
		open_shop: 'Shop öffnen',
		view_profile: 'Profil anzeigen',
		view_trophies: 'Trophäen anzeigen',
		open_settings: 'Einstellungen öffnen',
		view_about: 'Über uns anzeigen'
	},

	// Über uns
	about: {
		title: 'Über Hawk3',
		subtitle: 'Erfahre mehr über diese Spieleplattform und ihren Entwickler',

		platform: {
			title: 'Über die Plattform',
			description: 'Hawk3 ist eine moderne Spieleplattform, die mit Vue 3 entwickelt wurde und mehrere Mini-Spiele, Erfolg-Systeme und mehrsprachige Unterstützung bietet. Entwickelt mit einem Mobile-First-Ansatz für die beste Spielerfahrung.',
			version: 'Version',
			status: 'Status',
			status_value: 'Aktive Entwicklung',
			features: 'Features',
			technologies: 'Technologien',
			feature_list: {
				memory_game: 'Memory-Spiel mit 6 Leveln',
				achievement_system: 'Umfassendes Erfolgs-System',
				internationalization: 'Deutsch & Englisch Unterstützung'
			}
		},

		developer: {
			title: 'Über den Entwickler',
			description: 'Hawk3 wird mit Leidenschaft für ansprechende und zugängliche Spielerfahrungen entwickelt. Der Fokus liegt auf sauberem Code, modernen Technologien und benutzerfreundlichem Design.',
			name: 'Entwickler',
			location: 'Standort',
			contact: 'Entwickler kontaktieren'
		},

		privacy: {
			title: 'Datenschutz & Daten',
			description: 'Deine Privatsphäre ist uns wichtig. Hawk3 ist mit datenschutzfreundlichen Prinzipien und transparenter Datenverarbeitung entwickelt.',
			local_storage: {
				title: 'Lokale Datenspeicherung',
				description: 'Alle deine Spielfortschritte, Einstellungen und Erfolge werden lokal in deinem Browser gespeichert. Keine Daten werden an externe Server gesendet.'
			},
			no_tracking: {
				title: 'Kein Tracking',
				description: 'Wir verwenden keine Analyse-Tools, Tracking-Skripte oder Drittanbieter-Services, die deine persönlichen Daten sammeln.'
			},
			data_control: {
				title: 'Vollständige Datenkontrolle',
				description: 'Du hast die vollständige Kontrolle über deine Daten. Du kannst jederzeit alle deine Daten über die Einstellungen exportieren, importieren oder löschen.'
			}
		},

		legal: {
			title: 'Rechtliche Informationen',
			description: 'Wichtige rechtliche Informationen zur Nutzung der Hawk3 Spieleplattform.',
			license: {
				title: 'Open Source',
				description: 'Hawk3 nutzt Open-Source-Technologien und folgt modernen Web-Standards. Das Projekt respektiert alle Software-Lizenzen und Zuordnungen.'
			},
			disclaimer: {
				title: 'Haftungsausschluss',
				description: 'Hawk3 wird wie besehen für Unterhaltungszwecke bereitgestellt. Obwohl wir uns um eine fehlerfreie Erfahrung bemühen, können wir keinen ununterbrochenen Service garantieren.'
			},
			usage: {
				title: 'Nutzungsbedingungen',
				description: 'Durch die Nutzung von Hawk3 stimmst du zu, die Plattform verantwortlich und in Übereinstimmung mit geltenden Gesetzen und Vorschriften zu nutzen.'
			}
		},

		contact: {
			title: 'Kontakt & Feedback',
			description: 'Wir schätzen dein Feedback und deine Vorschläge zur Verbesserung von Hawk3. Zögere nicht, dich mit Fragen, Fehlermeldungen oder Feature-Wünschen zu melden.',
			email: 'E-Mail senden',
			feedback: 'Feedback teilen'
		}
	},

	// Profil
	profile: {
		title: 'Spielerprofil',
		display_name: 'Anzeigename',
		avatar: 'Avatar',
		level: 'Level',
		experience: 'Erfahrung',
		total_score: 'Gesamtpunkte',
		games_played: 'Gespielte Spiele',
		created_at: 'Mitglied seit',
		last_played: 'Zuletzt gespielt',
		select_avatar: '{name} Avatar auswählen',
		stats: {
			level: 'Level',
			score: 'Punkte',
			played: 'Gespielt'
		},
		currency: {
			coins: 'Münzen',
			diamonds: 'Diamanten',
			total_earned: 'Gesamt: {amount}',
			recent_earnings: 'Aktuelle Einnahmen',
			transaction_history: 'Transaktionsverlauf',
			no_transactions: 'Keine aktuellen Transaktionen'
		},
		avatars: {
			default_user: 'Standard Benutzer',
			beard_user: 'Bart Benutzer',
			glasses_user: 'Brille Benutzer',
			headset_user: 'Headset Benutzer',
			cap_user: 'Kappe Benutzer'
		},
		inventory: {
			title: 'Inventar',
			empty: 'Noch keine Gegenstände',
			empty_description: 'Besuche den Shop, um Gegenstände und Upgrades zu kaufen!'
		}
	},

	// Shop
	shop: {
		title: 'Shop',
		subtitle: 'Gegenstände und Upgrades kaufen',
		categories: {
			cosmetics: 'Kosmetik',
			powerups: 'Power-ups',
			utilities: 'Werkzeuge'
		},
		confirm_purchase: 'Kauf bestätigen',
		item_cost: 'Artikelkosten',
		your_balance: 'Dein Guthaben',
		after_purchase: 'Nach dem Kauf',
		insufficient_funds: 'Unzureichendes Guthaben',
		purchase_now: 'Jetzt kaufen',
		empty_category: 'Keine Artikel verfügbar',
		empty_category_description: 'Schau später für neue Artikel vorbei!',
		price: 'Preis',
		purchase: 'Kaufen',
		owned: 'Besessen',
		one_time_purchase: 'Einmalkauf',

		types: {
			avatar_pack: 'Avatar-Paket',
			profile_frame: 'Profil-Rahmen',
			theme: 'Design',
			boost: 'Power-up',
			consumable: 'Verbrauchsgegenstand'
		},

		rarities: {
			common: 'Gewöhnlich',
			uncommon: 'Ungewöhnlich',
			rare: 'Selten',
			epic: 'Episch',
			legendary: 'Legendär'
		}
	},

	// Einstellungen
	settings: {
		title: 'Einstellungen',
		theme: 'Design',
		language: 'Sprache',
		sound: 'Sound',
		music: 'Musik',
		profile_management: 'Profilverwaltung',
		delete_profile: 'Profil löschen',
		delete_profile_description: 'Dies wird dauerhaft deinen gesamten Spielfortschritt, Erfolge und Einstellungen löschen. Diese Aktion kann nicht rückgängig gemacht werden.',
		delete_warning: 'Diese Aktion kann nicht rückgängig gemacht werden!',
		delete_confirmation: {
			title: 'Profillöschung bestätigen',
			message: 'Bist du dir absolut sicher, dass du dein Profil löschen möchtest? Dies wird dauerhaft entfernen:',
			items: [
				'Gesamten Spielfortschritt und Punkte',
				'Alle Erfolge und Trophäen',
				'Spielereinstellungen und Präferenzen',
				'Avatar und Profilanpassungen'
			],
			warning: 'Diese Aktion kann nicht rückgängig gemacht werden!',
			confirm: 'Alles löschen'
		},
		themes: {
			dark: 'Dunkel',
			light: 'Hell',
			system: 'System'
		},
		font_size: 'Schriftgröße',
		font_sizes: {
			small: 'Klein',
			medium: 'Normal',
			large: 'Groß'
		},
		languages: {
			english: 'English',
			german: 'Deutsch'
		}
	},

	// Spiele-Hub
	gaming: {
		title: 'Spiele',
		subtitle: 'Fordere dich selbst mit spannenden Spielen heraus',
		choose_level: 'Wähle dein Level',
		back_to_games: 'Zurück zu Spielen',
		back_to_game_hub: 'Zurück zum Spiele',
		coming_soon: 'Bald verfügbar',
		play_level: '{title} spielen',
		replay: 'Wiederholen',
		saved_progress: 'Gespeicherter Fortschritt verfügbar',
		saved_just_now: 'Gerade gespeichert',
		saved_minutes_ago: 'Vor {minutes} Minuten gespeichert',
		saved_hours_ago: 'Vor {hours} Stunden gespeichert',
		saved_days_ago: 'Vor {days} Tagen gespeichert',
		continue_game: 'Fortsetzen',
		start_fresh: 'Neu beginnen',
		stats: {
			best_score: 'Beste: {score}',
			games_played: '{count} gespielt',
			levels: 'Level',
			stars: 'Sterne',
			unlocked: 'Freigeschaltet',
			pairs: 'Paare'
		}
	},

	// Memory-Spiel
	memory: {
		title: 'Memory-Spiel',
		description: 'Finde Kartenpaare und teste dein Gedächtnis',
		level_title: 'Level {level}',
		game_paused: 'Spiel pausiert',
		level_complete: 'Level abgeschlossen!',
		game_complete: 'Spiel abgeschlossen!',
		perfect_performance: 'Perfekte Leistung!',
		great_job: 'Großartige Arbeit!',
		well_done: 'Gut gemacht!',
		back_to_levels: 'Zurück',
		play_again: 'Nochmal spielen',
		next_level: 'Nächstes Level',
		levels: {
			1: { title: 'Starter', description: 'Finde 3 Paare - Lerne die Grundlagen' },
			2: { title: 'Einfach', description: 'Finde 6 Paare - Verbessere deine Fähigkeiten' },
			3: { title: 'Mittel', description: 'Finde 8 Paare - Teste dein Gedächtnis' },
			4: { title: 'Schwer', description: 'Finde 10 Paare - Fordere dich heraus' },
			5: { title: 'Experte', description: 'Finde 12 Paare - Expertenlevel' },
			6: { title: 'Meister', description: 'Finde 18 Paare - Meisterherausforderung' }
		}
	},

	// FruitMerge-Spiel
	fruitMerge: {
		title: 'Fruit Merge',
		description: 'Füge Früchte zusammen und erstelle neue Kombinationen',
		target: 'Ziel',
		level_title: 'Level {level}',
		endless_mode: 'Endlos-Modus',
		game_paused: 'Spiel pausiert',
		level_complete: 'Level abgeschlossen!',
		game_complete: 'Spiel abgeschlossen!',
		back_to_levels: 'Zurück',
		play_again: 'Nochmal spielen',
		next_level: 'Nächstes Level',
		game_over: 'Spiel Vorbei',
		game_over_message: 'Früchte haben die Gefahrenzone erreicht! Versuche eine andere Strategie.',
		try_again: 'Nochmal versuchen',
		combo: 'Combo',
		multiplier: 'Multiplikator',
		combo_break: 'Combo unterbrochen!',
		amazing_combo: 'Fantastische Combo!',
		incredible_combo: 'Unglaubliche Combo!',
		state_restored: 'Spielstand wiederhergestellt',
		save_game: 'Spiel speichern',

		// Endless Mode spezifische Übersetzungen
		endless: {
			merges: 'Merges',
			time: 'Zeit',
			score_goal_1: '5.000 Punkte für 1 Stern',
			score_goal_2: '15.000 Punkte für 2 Sterne',
			score_goal_3: '35.000 Punkte für 3 Sterne',
			merge_goal_1: '50 Merges für 1 Stern',
			merge_goal_2: '120 Merges für 2 Sterne',
			merge_goal_3: '250 Merges für 3 Sterne',
			milestone_score: '{score} Punkte erreicht!',
			milestone_time: '{minutes} Minuten gespielt!',
			milestone_combo: '{combo}er Combo erreicht!',
			session_stats: 'Session-Statistiken',
			best_combo: 'Beste Combo',
			total_time: 'Gesamtzeit',
			achievements_unlocked: 'Erfolge freigeschaltet'
		},

		fruits: {
			blueberry: 'Blaubeere',
			strawberry: 'Erdbeere',
			lemon: 'Zitrone',
			orange: 'Orange',
			apple: 'Apfel',
			grapefruit: 'Grapefrucht',
			pineapple: 'Ananas',
			coconut: 'Kokosnuss',
			melon: 'Melone'
		},

		levels: {
			1: {
				title: 'Anfänger',
				description: 'Erstelle einen Apfel'
			},
			2: {
				title: 'Grape-Meister',
				description: 'Erstelle eine Grapefrucht'
			},
			3: {
				title: 'Ananas-Challenge',
				description: 'Erstelle eine Ananas'
			},
			4: {
				title: 'Kokosnuss-Experte',
				description: 'Erstelle eine Kokosnuss'
			},
			5: {
				title: 'Melonen-Meister',
				description: 'Erstelle eine Melone'
			},
			6: {
				title: 'Endlos-Modus',
				description: 'Erstelle so viele Früchte wie möglich'
			}
		}
	},

	// Leistungsstatistiken
	stats: {
		score: 'Punkte',
		final_score: 'Endpunkte',
		high_score: 'Höchstpunkte',
		time: 'Zeit',
		time_elapsed: 'Verstrichene Zeit',
		best_time: 'Beste Zeit',
		moves: 'Züge',
		matches: 'Treffer',
		pairs: 'Paare',
		combo: 'Combo',
		max_combo: 'Max Combo',
		level: 'Level',
		attempts: 'Versuche',
		completion: 'Vollendung',
		performance: 'Leistung'
	},

	// Erfolge/Trophäen
	achievements: {
		title: 'Trophäensammlung',
		new_achievements: 'Neue Erfolge!',
		earned: 'Erhalten am {date}',
		progress: 'Fortschritt',
		categories: {
			general: 'Allgemein',
			gaming: 'Spiele',
			progress: 'Fortschritt',
			special: 'Besonders'
		},
		rarities: {
			common: 'Häufig',
			uncommon: 'Ungewöhnlich',
			rare: 'Selten',
			epic: 'Episch',
			legendary: 'Legendär'
		},
		definitions: {
			welcome: {
				name: 'Willkommen bei Hawk3',
				description: 'Deine Spielreise begonnen'
			},
			first_game: {
				name: 'Erstes Spiel',
				description: 'Dein erstes Spiel gespielt'
			},
			level_5: {
				name: 'Aufsteigender Stern',
				description: 'Level 5 erreicht'
			},
			level_10: {
				name: 'Engagierter Spieler',
				description: 'Level 10 erreicht'
			},
			level_15: {
				name: 'Spiele-Experte',
				description: 'Level 15 erreicht'
			},
			score_1000: {
				name: 'Punkte-Jäger',
				description: '1000 Gesamtpunkte erreicht'
			},
			games_10: {
				name: 'Spiele-Enthusiast',
				description: '10 Spiele gespielt'
			},
			memory_beginner: {
				name: 'Memory-Anfänger',
				description: 'Erstes Memory-Level abgeschlossen'
			},
			memory_intermediate: {
				name: 'Memory-Fortgeschrittener',
				description: 'Level 3 abgeschlossen'
			},
			memory_master: {
				name: 'Memory-Meister',
				description: 'Das schwerste Level abgeschlossen'
			},

			fruitMerge_beginner: {
				name: 'Frucht-Anfänger',
				description: 'Erstes FruitMerge Level abgeschlossen'
			},
			fruitMerge_intermediate: {
				name: 'Frucht-Zusammenfüger',
				description: 'FruitMerge Level 3 abgeschlossen'
			},
			fruitMerge_expert: {
				name: 'Zusammenfüge-Experte',
				description: 'FruitMerge Level 5 abgeschlossen'
			},
			fruitMerge_master: {
				name: 'Zusammenfüge-Meister',
				description: 'Die ultimative FruitMerge Herausforderung abgeschlossen'
			},endless_first_play: {
				name: 'Endlos-Entdecker',
				description: 'Dein erstes Endlos-Spiel gespielt',
			},
			endless_bronze: {
				name: 'Bronze-Merger',
				description: '1 Stern im Endlos-Modus erreicht',
			},
			endless_silver: {
				name: 'Silber-Merger',
				description: '2 Sterne im Endlos-Modus erreicht',
			},
			endless_gold: {
				name: 'Gold-Merger',
				description: '3 Sterne im Endlos-Modus erreicht',
			},
			endless_marathon: {
				name: 'Marathon-Merger',
				description: 'Endlos-Modus für 30 Minuten gespielt',
			},
			endless_merge_master: {
				name: 'Merge-Meister',
				description: '500 Zusammenfügungen im Endlos-Modus durchgeführt',
			},

			perfectionist: {
				name: 'Perfektionist',
				description: 'Ein Spiel mit perfekter Punktzahl abgeschlossen'
			},

			welcome_card_read: {
				name: 'Erste Schritte',
				description: 'Willkommensnachricht gelesen'
			},
		}
	},

	// Spielsteuerung
	controls: {
		pause: 'Pausieren',
		resume: 'Fortsetzen',
		reset: 'Zurücksetzen',
		back: 'Zurück',
		menu: 'Menü'
	},

	// Zeit/Datum Formatierung
	time: {
		seconds: 'Sekunden',
		minutes: 'Minuten',
		hours: 'Stunden',
		days: 'Tage',
		weeks: 'Wochen',
		months: 'Monate',
		years: 'Jahre',
		ago: 'vor',
		in: 'in',
		now: 'jetzt',
		format: {
			time_short: '{minutes}:{seconds}',
		}
	},

	// Fehlermeldungen
	errors: {
		generic: 'Etwas ist schiefgelaufen',
		loading_failed: 'Laden fehlgeschlagen',
		save_failed: 'Speichern fehlgeschlagen',
		invalid_input: 'Ungültige Eingabe',
		network_error: 'Netzwerkfehler',
		not_found: 'Nicht gefunden',
		permission_denied: 'Berechtigung verweigert',
		session_expired: 'Sitzung abgelaufen'
	},

	// Erfolgsmeldungen
	success: {
		saved: 'Erfolgreich gespeichert',
		updated: 'Erfolgreich aktualisiert',
		deleted: 'Erfolgreich gelöscht',
		completed: 'Erfolgreich abgeschlossen',
		unlocked: 'Freigeschaltet!',
		achievement_earned: 'Erfolg erhalten!'
	},

	// Validierungsmeldungen
	validation: {
		required: 'Dieses Feld ist erforderlich',
		min_length: 'Mindestens {count} Zeichen erforderlich',
		max_length: 'Maximal {count} Zeichen erlaubt',
		invalid_email: 'Ungültige E-Mail-Adresse',
		invalid_format: 'Ungültiges Format',
		numbers_only: 'Nur Zahlen',
		letters_only: 'Nur Buchstaben'
	},

	// Barrierefreiheit
	a11y: {
		menu_button: 'Menü öffnen',
		close_button: 'Schließen',
		play_button: 'Spiel spielen',
		pause_button: 'Spiel pausieren',
		settings_button: 'Einstellungen öffnen',
		profile_button: 'Profil anzeigen',
		notification_button: 'Benachrichtigungen anzeigen',
		back_button: 'Zurück gehen',
		star_rating: '{count} von 3 Sternen',
		level_locked: 'Level gesperrt',
		level_unlocked: 'Level freigeschaltet',
		achievement_earned: 'Erfolg erhalten',
		combo_active: 'Combo aktiv',
		combo_inactive: 'Combo inaktiv'
	}
}