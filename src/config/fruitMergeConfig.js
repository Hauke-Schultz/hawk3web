
// Physics configuration
export const PHYSICS_CONFIG = {
	board: {
		width: 280,
		height: 320,
		thickness: 10,
	},

	engine: {
		gravity: {
			x: 0,
			y: 0.8,
			scale: 0.001
		},
		velocityIterations: 4,
		positionIterations: 4,
		enableSleeping: true,
		broadphase: {
			bucketWidth: 100,
			bucketHeight: 100
		},
		timing: {
			timeScale: 1,
			isFixed: true,
			delta: 16.666
		}
	},

	fruit: {
		restitution: 0.3,
		friction: 0.05,
		frictionAir: 0.005,
		density: 0.001,
		sleepThreshold: 60,

		collisionFilter: {
			group: 0,
			category: 0x0001,
			mask: 0xFFFF
		}
	},

	walls: {
		restitution: 0.3,
		friction: 0.8,
		frictionStatic: 1.0,
		color: '#333'
	},

	dropCooldown: 600,
	dropPosition: {
		x: 0.5,
		y: 0.1
	},

	sparkleDelay: 2000,

	// Pop Effect Configuration
	popEffect: {
		upwardForce: -1,
		horizontalVariation: 1.5,
		delay: 50,
		spawnOffset: 6
	},

	// Game Over
	gameOverHeight: 100,
	fruitsInDanger: 3,
	warningZone: 80,
	gameOverCheckInterval: 1000
}

// Fruit Configuration System
export const FRUIT_TYPES = {
	BLUEBERRY: {
		index: 1,
		type: 'BLUEBERRY',
		emoji: '🫐',
		radius: 15,
		nextType: 'STRAWBERRY',
		color: '#4c6ef5',
		scoreValue: 10,
		gradient: ['#748ffc', '#4c6ef5', '#364fc7'],
		shadow: '0 2px 8px rgba(54, 79, 199, 0.4)',
		glowColor: 'rgba(76, 110, 245, 0.6)',
		sparkleColor: '#9C27B0',
		svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
    <defs>
        <radialGradient id="blueberryGrad" cx="0.3" cy="0.3">
            <stop offset="0%" style="stop-color:#BA68C8"/>
            <stop offset="100%" style="stop-color:#9C27B0"/>
        </radialGradient>
        <radialGradient id="mouthGrad" cx="0.5" cy="0.3">
            <stop offset="0%" style="stop-color:#2E2E2E"/>
            <stop offset="100%" style="stop-color:#000000"/>
        </radialGradient>
    </defs>
    <circle cx="32" cy="32" r="30" fill="url(#blueberryGrad)" stroke="#6A1B9A" stroke-width="2"/>
    <circle cx="20" cy="20" r="1.5" fill="#7B1FA2" opacity="0.6"/>
    <circle cx="44" cy="18" r="1.5" fill="#7B1FA2" opacity="0.6"/>
    <circle cx="18" cy="40" r="1.5" fill="#7B1FA2" opacity="0.6"/>
    <circle cx="46" cy="42" r="1.5" fill="#7B1FA2" opacity="0.6"/>
    <circle cx="32" cy="48" r="1.5" fill="#7B1FA2" opacity="0.6"/>
    <g id="openEyes">
        <ellipse cx="24" cy="26" rx="6" ry="6" fill="white"/>
        <ellipse cx="40" cy="26" rx="6" ry="6" fill="white"/>
        <circle cx="24" cy="26" r="2.5" fill="black"/>
        <circle cx="40" cy="26" r="2.5" fill="black"/>
        <circle cx="25" cy="25" r="1" fill="white"/>
        <circle cx="41" cy="25" r="1" fill="white"/>
        <path d="M26,38 Q32,44 38,38" stroke="black" stroke-width="2.5" fill="none" stroke-linecap="round"/>
        <animate
                attributeName="opacity"
                values="1; 1; 0; 1; 1"
                dur="10s"
                repeatCount="indefinite"
                calcMode="discrete"/>
    </g>
    <g id="closedEyes">
        <ellipse cx="24" cy="26" rx="7" ry="7" fill="white"/>
        <ellipse cx="40" cy="26" rx="7" ry="7" fill="white"/>
        <circle cx="24" cy="26" r="2.5" fill="black"/>
        <circle cx="40" cy="26" r="2.5" fill="black"/>
        <circle cx="25" cy="25" r="1" fill="white"/>
        <circle cx="41" cy="25" r="1" fill="white"/>
        <ellipse cx="32" cy="42" rx="10" ry="8" fill="url(#mouthGrad)" stroke="#000" stroke-width="1.5"/>
        <ellipse cx="32" cy="45" rx="6" ry="4" fill="#FF6B9D" opacity="0.8"/>
        <animate
                attributeName="opacity"
                values="0; 0; 1; 0; 0"
                dur="10s"
                repeatCount="indefinite"
                calcMode="discrete"/>
    </g>
    <ellipse cx="16" cy="32" rx="3" ry="2" fill="#8E24AA" opacity="0.4"/>
    <ellipse cx="48" cy="32" rx="3" ry="2" fill="#8E24AA" opacity="0.4"/>
</svg>`
	},
	STRAWBERRY: {
		index: 2,
		type: 'STRAWBERRY',
		emoji: '🍓',
		radius: 20,
		nextType: 'GRAPE',
		color: '#ff8787',
		scoreValue: 25,
		gradient: ['#ffab91', '#ff8787', '#f4511e'],
		shadow: '0 2px 8px rgba(244, 81, 30, 0.4)',
		glowColor: 'rgba(255, 135, 135, 0.6)',
		sparkleColor: '#E91E63',
		svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
    <defs>
        <radialGradient id="strawberryGrad" cx="0.3" cy="0.3">
            <stop offset="0%" style="stop-color:#F06292"/>
            <stop offset="100%" style="stop-color:#E91E63"/>
        </radialGradient>
    </defs>
    <circle cx="32" cy="32" r="30" fill="url(#strawberryGrad)" stroke="#C2185B" stroke-width="2"/>
    <circle cx="22" cy="22" r="1" fill="#FFEB3B" opacity="0.8"/>
    <circle cx="40" cy="20" r="1" fill="#FFEB3B" opacity="0.8"/>
    <circle cx="20" cy="38" r="1" fill="#FFEB3B" opacity="0.8"/>
    <circle cx="44" cy="40" r="1" fill="#FFEB3B" opacity="0.8"/>
    <circle cx="32" cy="46" r="1" fill="#FFEB3B" opacity="0.8"/>
    <circle cx="28" cy="16" r="1" fill="#FFEB3B" opacity="0.8"/>
    <circle cx="36" cy="48" r="1" fill="#FFEB3B" opacity="0.8"/>
    <g id="openEyes">
        <ellipse cx="24" cy="26" rx="6" ry="6" fill="white"/>
        <ellipse cx="40" cy="26" rx="6" ry="6" fill="white"/>
        <circle cx="24" cy="26" r="2.5" fill="black"/>
        <circle cx="40" cy="26" r="2.5" fill="black"/>
        <circle cx="25" cy="25" r="1" fill="white"/>
        <circle cx="41" cy="25" r="1" fill="white"/>
        <animate
                attributeName="opacity"
                values="1; 1; 0; 1; 1"
                dur="10s"
                repeatCount="indefinite"
                calcMode="discrete"/>
    </g>
    <g id="closedEyes">
        <ellipse cx="24" cy="26" rx="9" ry="9" fill="white" stroke="#ddd" stroke-width="1"/>
        <ellipse cx="40" cy="26" rx="9" ry="9" fill="white" stroke="#ddd" stroke-width="1"/>
        <circle cx="24" cy="26" r="3" fill="black"/>
        <circle cx="40" cy="26" r="3" fill="black"/>
        <circle cx="25.5" cy="24.5" r="1.5" fill="white"/>
        <circle cx="41.5" cy="24.5" r="1.5" fill="white"/>
        <animate
                attributeName="opacity"
                values="0; 0; 1; 0; 0"
                dur="10s"
                repeatCount="indefinite"
                calcMode="discrete"/>
    </g>
    <path d="M26,38 Q32,44 38,38" stroke="black" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <ellipse cx="16" cy="32" rx="3" ry="2" fill="#F8BBD9" opacity="0.6"/>
    <ellipse cx="48" cy="32" rx="3" ry="2" fill="#F8BBD9" opacity="0.6"/>
    <path d="M30,8 L34,8 L36,12 L28,12 Z" fill="#4CAF50"/>
</svg>`
	},
	GRAPE: {
		index: 3,
		type: 'GRAPE',
		emoji: '🍇',
		radius: 24,
		nextType: 'ORANGE',
		color: '#845ec2',
		scoreValue: 50,
		gradient: ['#b39ddb', '#845ec2', '#5e35b1'],
		shadow: '0 2px 8px rgba(94, 53, 177, 0.4)',
		glowColor: 'rgba(132, 94, 194, 0.6)',
		sparkleColor: '#FFEB3B',
		svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
    <defs>
        <radialGradient id="lemonGrad" cx="0.3" cy="0.3">
            <stop offset="0%" style="stop-color:#FFF176"/>
            <stop offset="100%" style="stop-color:#FFEB3B"/>
        </radialGradient>
    </defs>
    <circle cx="32" cy="32" r="30" fill="url(#lemonGrad)" stroke="#F57F17" stroke-width="2"/>
    <ellipse cx="22" cy="20" rx="2" ry="1" fill="#F9A825" opacity="0.5"/>
    <ellipse cx="42" cy="18" rx="2" ry="1" fill="#F9A825" opacity="0.5"/>
    <ellipse cx="18" cy="40" rx="2" ry="1" fill="#F9A825" opacity="0.5"/>
    <ellipse cx="46" cy="42" rx="2" ry="1" fill="#F9A825" opacity="0.5"/>
    <ellipse cx="32" cy="48" rx="2" ry="1" fill="#F9A825" opacity="0.5"/>
    <g id="openEyes">
        <ellipse cx="24" cy="26" rx="4" ry="5" fill="white"/>
        <ellipse cx="40" cy="26" rx="4" ry="5" fill="white"/>
        <circle cx="24" cy="26" r="2.5" fill="black"/>
        <circle cx="40" cy="26" r="2.5" fill="black"/>
        <circle cx="25" cy="25" r="1" fill="white"/>
        <circle cx="41" cy="25" r="1" fill="white"/>
        <animate
                attributeName="opacity"
                values="1; 1; 0; 1; 1"
                dur="3s"
                repeatCount="indefinite"
                calcMode="discrete"/>
    </g>
    <g id="closedEyes">
        <line x1="20" y1="26" x2="28" y2="26" stroke="black" stroke-width="2" stroke-linecap="round"/>
        <line x1="36" y1="26" x2="44" y2="26" stroke="black" stroke-width="2" stroke-linecap="round"/>
        <animate
                attributeName="opacity"
                values="0; 0; 1; 0; 0"
                dur="3s"
                repeatCount="indefinite"
                calcMode="discrete"/>
    </g>
    <path d="M26,38 Q32,44 38,38" stroke="black" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <ellipse cx="16" cy="32" rx="3" ry="2" fill="#FFC107" opacity="0.4"/>
    <ellipse cx="48" cy="32" rx="3" ry="2" fill="#FFC107" opacity="0.4"/>
</svg>`
	},
	ORANGE: {
		index: 4,
		type: 'ORANGE',
		emoji: '🍊',
		radius: 28,
		nextType: 'APPLE',
		color: '#ffa726',
		scoreValue: 100,
		gradient: ['#ffcc02', '#ffa726', '#ff9800'],
		shadow: '0 2px 8px rgba(255, 152, 0, 0.4)',
		glowColor: 'rgba(255, 167, 38, 0.6)',
		sparkleColor: '#FF9800',
		svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
    <defs>
        <radialGradient id="orangeGrad" cx="0.3" cy="0.3">
            <stop offset="0%" style="stop-color:#FFB74D"/>
            <stop offset="100%" style="stop-color:#FF9800"/>
        </radialGradient>
    </defs>
    <circle cx="32" cy="32" r="30" fill="url(#orangeGrad)" stroke="#E65100" stroke-width="2"/>
    <circle cx="20" cy="20" r="1.5" fill="#FF7043" opacity="0.6"/>
    <circle cx="44" cy="18" r="1.5" fill="#FF7043" opacity="0.6"/>
    <circle cx="18" cy="40" r="1.5" fill="#FF7043" opacity="0.6"/>
    <circle cx="46" cy="42" r="1.5" fill="#FF7043" opacity="0.6"/>
    <circle cx="32" cy="48" r="1.5" fill="#FF7043" opacity="0.6"/>
    <g id="openEyes">
        <ellipse cx="24" cy="26" rx="5" ry="5" fill="white"/>
        <ellipse cx="40" cy="26" rx="5" ry="5" fill="white"/>
        <circle cx="24" cy="26" r="2.5" fill="black"/>
        <circle cx="40" cy="26" r="2.5" fill="black"/>
        <circle cx="25" cy="25" r="1" fill="white"/>
        <circle cx="41" cy="25" r="1" fill="white"/>
        <animate
                attributeName="opacity"
                values="1; 1; 0; 1; 1"
                dur="6s"
                repeatCount="indefinite"
                calcMode="discrete"/>
    </g>
    <g id="closedEyes">
        <ellipse cx="24" cy="26" rx="4" ry="5" fill="white"/>
        <circle cx="24" cy="26" r="2.5" fill="black"/>
        <circle cx="25" cy="25" r="1" fill="white"/>
        <line x1="36" y1="26" x2="44" y2="26" stroke="black" stroke-width="2" stroke-linecap="round"/>
        <animate
                attributeName="opacity"
                values="0; 0; 1; 0; 0"
                dur="6s"
                repeatCount="indefinite"
                calcMode="discrete"/>
    </g>
    <path d="M26,38 Q32,44 38,38" stroke="black" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <ellipse cx="16" cy="32" rx="3" ry="2" fill="#FF5722" opacity="0.4"/>
    <ellipse cx="48" cy="32" rx="3" ry="2" fill="#FF5722" opacity="0.4"/>
</svg>`
	},
	APPLE: {
		index: 5,
		type: 'APPLE',
		emoji: '🍎',
		radius: 34,
		nextType: 'PEACH',
		color: '#e53e3e',
		scoreValue: 200,
		gradient: ['#ef5350', '#e53e3e', '#c62828'],
		shadow: '0 3px 12px rgba(198, 40, 40, 0.5)',
		glowColor: 'rgba(229, 62, 62, 0.7)',
		sparkleColor: '#36c904',
		svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
    <defs>
        <radialGradient id="appleGrad" cx="0.3" cy="0.3">
            <stop offset="0%" style="stop-color: #5fe865"/>
            <stop offset="100%" style="stop-color: #36c904"/>
        </radialGradient>
    </defs>
    <circle cx="32" cy="32" r="30" fill="url(#appleGrad)" stroke="#4b9916" stroke-width="2"/>
    <circle cx="20" cy="20" r="1.5" fill="#689F38" opacity="0.6"/>
    <circle cx="44" cy="18" r="1.5" fill="#689F38" opacity="0.6"/>
    <circle cx="18" cy="40" r="1.5" fill="#689F38" opacity="0.6"/>
    <circle cx="46" cy="42" r="1.5" fill="#689F38" opacity="0.6"/>
    <circle cx="32" cy="48" r="1.5" fill="#689F38" opacity="0.6"/>
    <g id="openEyes">
        <ellipse cx="24" cy="26" rx="7" ry="7" fill="white"/>
        <ellipse cx="40" cy="26" rx="6" ry="6" fill="white"/>
        <circle cx="24" cy="26" r="2.5" fill="black"/>
        <circle cx="40" cy="26" r="2.5" fill="black"/>
        <circle cx="25" cy="25" r="1" fill="white"/>
        <circle cx="41" cy="25" r="1" fill="white"/>
        <path d="M26,38 Q32,44 38,38" stroke="black" stroke-width="2.5" fill="none" stroke-linecap="round"/>
        <ellipse cx="16" cy="32" rx="3" ry="2" fill="#C8E6C9" opacity="0.6"/>
        <ellipse cx="48" cy="32" rx="3" ry="2" fill="#C8E6C9" opacity="0.6"/>
        <animate
                attributeName="opacity"
                values="1; 1; 0; 1; 1"
                dur="10s"
                repeatCount="indefinite"
                calcMode="discrete"/>
    </g>
    <g id="closedEyes">
        <line x1="20" y1="25" x2="28" y2="26" stroke="black" stroke-width="2" stroke-linecap="round"/>
        <line x1="36" y1="26" x2="44" y2="25" stroke="black" stroke-width="2" stroke-linecap="round"/>
        <path d="M26,38 Q32,44 38,38" stroke="black" stroke-width="2.5" fill="none" stroke-linecap="round"/>
        <ellipse cx="14" cy="32" rx="9" ry="8" fill="#FF0000" opacity="0.4"/>
        <ellipse cx="50" cy="32" rx="9" ry="8" fill="#FF0000" opacity="0.4"/>
        <animate
                attributeName="opacity"
                values="0; 0; 1; 0; 0"
                dur="10s"
                repeatCount="indefinite"
                calcMode="discrete"/>
    </g>
    <ellipse cx="30" cy="8" rx="4" ry="2" fill="#795548"/>
    <ellipse cx="34" cy="6" rx="2" ry="3" fill="#4CAF50"/>
</svg>`
	},
	PEACH: {
		index: 6,
		type: 'PEACH',
		emoji: '🍑',
		radius: 40,
		nextType: 'PINEAPPLE',
		color: '#ff7043',
		scoreValue: 400,
		gradient: ['#ffab91', '#ff7043', '#d84315'],
		shadow: '0 3px 12px rgba(216, 158, 46, 0.5)',
		glowColor: 'rgba(255, 112, 67, 0.7)',
		sparkleColor: '#FFAB91',
		svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
    <defs>
        <radialGradient id="peachGrad" cx="0.3" cy="0.3">
            <stop offset="0%" style="stop-color:#FFCC80"/>
            <stop offset="100%" style="stop-color:#FFAB91"/>
        </radialGradient>
    </defs>
    <circle cx="32" cy="32" r="30" fill="url(#peachGrad)" stroke="#FF8A65" stroke-width="2"/>
    <path d="M28,8 Q32,12 36,8" stroke="#FF7043" stroke-width="2" fill="none" opacity="0.6"/>
    <path d="M24,16 Q32,20 40,16" stroke="#FF7043" stroke-width="1.5" fill="none" opacity="0.5"/>
    <path d="M20,28 Q32,32 44,28" stroke="#FF7043" stroke-width="1.5" fill="none" opacity="0.4"/>
    <path d="M22,44 Q32,40 42,44" stroke="#FF7043" stroke-width="1.5" fill="none" opacity="0.4"/>
    <circle cx="20" cy="20" r="1.5" fill="#FF8A65" opacity="0.6"/>
    <circle cx="44" cy="18" r="1.5" fill="#FF8A65" opacity="0.6"/>
    <circle cx="18" cy="40" r="1.5" fill="#FF8A65" opacity="0.6"/>
    <circle cx="46" cy="42" r="1.5" fill="#FF8A65" opacity="0.6"/>
    <circle cx="32" cy="48" r="1.5" fill="#FF8A65" opacity="0.6"/>
    <ellipse cx="24" cy="26" rx="5" ry="5" fill="white"/>
    <ellipse cx="40" cy="26" rx="5" ry="5" fill="white"/>
    <circle cx="24" cy="26" r="2.5" fill="black"/>
    <circle cx="40" cy="26" r="2.5" fill="black"/>
    <circle cx="25" cy="25" r="1" fill="white"/>
    <circle cx="41" cy="25" r="1" fill="white"/>
    <path d="M26,38 Q32,44 38,38" stroke="black" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <ellipse cx="16" cy="32" rx="3" ry="2" fill="#FFCDD2" opacity="0.6"/>
    <ellipse cx="48" cy="32" rx="3" ry="2" fill="#FFCDD2" opacity="0.6"/>
    <ellipse cx="26" cy="16" rx="6" ry="3" fill="#FFE0B2" opacity="0.5"/>
    <ellipse cx="14" cy="26" rx="4" ry="6" fill="#F8BBD0" opacity="0.3"/>
</svg>`
	},
	PINEAPPLE: {
		index: 7,
		type: 'PINEAPPLE',
		emoji: '🍍',
		radius: 58,
		nextType: 'COCONUT',
		color: '#d69e2e',
		scoreValue: 800,
		gradient: ['#ffd54f', '#d69e2e', '#f57f17'],
		shadow: '0 4px 16px rgba(245, 127, 23, 0.6)',
		glowColor: 'rgba(214, 158, 46, 0.8)',
		sparkleColor: '#FDD835',
		svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
    <defs>
        <radialGradient id="pineappleInnerGrad" cx="0.4" cy="0.4">
            <stop offset="0%" style="stop-color:#FFF9C4"/>
            <stop offset="30%" style="stop-color:#FFF176"/>
            <stop offset="70%" style="stop-color:#FFEB3B"/>
            <stop offset="100%" style="stop-color:#FDD835"/>
        </radialGradient>
    </defs>
    <circle cx="32" cy="32" r="30" fill="#FFEE58" stroke="#5D4037" stroke-width="2"/>
    <g stroke="#4CAF50" stroke-width="5.5" fill="#F9A825" opacity="0.8">
        <path d="M20,12 L22,6 L24,12 L26,8 L28,14 Z"/>
        <path d="M28,8 L30,4 L32,10 L34,6 L36,12 Z"/>
        <path d="M36,8 L38,4 L40,10 L42,6 L44,12 Z"/>
    </g>
    <g stroke="#F9A825" stroke-width="2" fill="none" opacity="0.8">
        <path d="M12,24 Q32,20 52,24"/>
        <path d="M10,32 Q32,28 54,32"/>
        <path d="M12,40 Q32,36 52,40"/>
        <path d="M14,48 Q32,44 50,48"/>
        <path d="M18,20 L22,24 L26,20 L30,24 L34,20 L38,24 L42,20 L46,24"/>
        <path d="M16,28 L20,32 L24,28 L28,32 L32,28 L36,32 L40,28 L44,32 L48,28"/>
        <path d="M18,36 L22,40 L26,36 L30,40 L34,36 L38,40 L42,36 L46,40"/>
        <path d="M20,44 L24,48 L28,44 L32,48 L36,44 L40,48 L44,44"/>
    </g>
    <g fill="#FFEE58" opacity="0.6">
        <path d="M24,22 L26,20 L28,22 L26,24 Z"/>
        <path d="M36,22 L38,20 L40,22 L38,24 Z"/>
        <path d="M18,30 L20,28 L22,30 L20,32 Z"/>
        <path d="M30,30 L32,28 L34,30 L32,32 Z"/>
        <path d="M42,30 L44,28 L46,30 L44,32 Z"/>
        <path d="M24,38 L26,36 L28,38 L26,40 Z"/>
        <path d="M36,38 L38,36 L40,38 L38,40 Z"/>
        <path d="M30,46 L32,44 L34,46 L32,48 Z"/>
    </g>
    <ellipse cx="24" cy="28" rx="5" ry="5" fill="white"/>
    <ellipse cx="40" cy="28" rx="5" ry="5" fill="white"/>
    <circle cx="24" cy="28" r="2.5" fill="black"/>
    <circle cx="40" cy="28" r="2.5" fill="black"/>
    <circle cx="25" cy="27" r="1" fill="white"/>
    <circle cx="41" cy="27" r="1" fill="white"/>
    <path d="M26,40 Q32,46 38,40" stroke="black" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <ellipse cx="16" cy="34" rx="3" ry="2" fill="#FFCC80" opacity="0.7"/>
    <ellipse cx="48" cy="34" rx="3" ry="2" fill="#FFCC80" opacity="0.7"/>
</svg>`
	},
	COCONUT: {
		index: 8,
		type: 'COCONUT',
		emoji: '🥥',
		radius: 74,
		nextType: 'MELON',
		color: '#8b4513',
		scoreValue: 3200,
		gradient: ['#a1887f', '#8b4513', '#5d4037'],
		shadow: '0 5px 20px rgba(93, 64, 55, 0.7)',
		glowColor: 'rgba(139, 69, 19, 0.9)',
		sparkleColor: '#8D6E63',
		svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
    <defs>
        <radialGradient id="coconutGrad" cx="0.3" cy="0.3">
            <stop offset="0%" style="stop-color:#A1887F"/>
            <stop offset="100%" style="stop-color:#8D6E63"/>
        </radialGradient>
    </defs>
    <circle cx="32" cy="32" r="30" fill="url(#coconutGrad)" stroke="#5D4037" stroke-width="2"/>
    <path d="M20,16 Q32,20 44,16" stroke="#6D4C41" stroke-width="2" fill="none" opacity="0.6"/>
    <path d="M18,28 Q32,32 46,28" stroke="#6D4C41" stroke-width="2" fill="none" opacity="0.6"/>
    <path d="M18,36 Q32,40 46,36" stroke="#6D4C41" stroke-width="2" fill="none" opacity="0.6"/>
    <path d="M20,48 Q32,44 44,48" stroke="#6D4C41" stroke-width="2" fill="none" opacity="0.6"/>
    <circle cx="22" cy="22" r="1.5" fill="#5D4037" opacity="0.8"/>
    <circle cx="42" cy="20" r="1.5" fill="#5D4037" opacity="0.8"/>
    <circle cx="20" cy="42" r="1.5" fill="#5D4037" opacity="0.8"/>
    <circle cx="44" cy="44" r="1.5" fill="#5D4037" opacity="0.8"/>
    <ellipse cx="24" cy="26" rx="5" ry="5" fill="white"/>
    <ellipse cx="40" cy="26" rx="5" ry="5" fill="white"/>
    <circle cx="24" cy="26" r="2.5" fill="black"/>
    <circle cx="40" cy="26" r="2.5" fill="black"/>
    <circle cx="25" cy="25" r="1" fill="white"/>
    <circle cx="41" cy="25" r="1" fill="white"/>
    <path d="M26,38 Q32,44 38,38" stroke="black" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <ellipse cx="16" cy="32" rx="3" ry="2" fill="#D7CCC8" opacity="0.6"/>
    <ellipse cx="48" cy="32" rx="3" ry="2" fill="#D7CCC8" opacity="0.6"/>
    <circle cx="30" cy="18" r="1" fill="#3E2723" opacity="0.9"/>
    <circle cx="34" cy="18" r="1" fill="#3E2723" opacity="0.9"/>
    <circle cx="32" cy="16" r="1" fill="#3E2723" opacity="0.9"/>
</svg>`
	},
	MELON: {
		index: 9,
		type: 'MELON',
		emoji: '🍉',
		radius: 88,
		nextType: null,
		color: '#38b2ac',
		scoreValue: 1600,
		gradient: ['#4db6ac', '#38b2ac', '#00695c'],
		shadow: '0 4px 16px rgba(0, 105, 92, 0.6)',
		glowColor: 'rgba(56, 178, 172, 0.8)',
		sparkleColor: '#b2dfdb',
		svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
    <defs>
        <radialGradient id="watermelonGrad" cx="0.3" cy="0.3">
            <stop offset="0%" style="stop-color:#F8BBD0"/>
            <stop offset="100%" style="stop-color:#F48FB1"/>
        </radialGradient>
    </defs>
    <circle cx="32" cy="32" r="30" fill="url(#watermelonGrad)" stroke="#008e00" stroke-width="2"/>
    <circle cx="32" cy="32" r="26" fill="#F06292" opacity="0.8"/>
    <circle cx="22" cy="22" r="2" fill="#1B5E20" opacity="0.9"/>
    <circle cx="42" cy="20" r="2" fill="#1B5E20" opacity="0.9"/>
    <circle cx="20" cy="42" r="2" fill="#1B5E20" opacity="0.9"/>
    <circle cx="44" cy="44" r="2" fill="#1B5E20" opacity="0.9"/>
    <circle cx="32" cy="18" r="1.5" fill="#1B5E20" opacity="0.9"/>
    <circle cx="18" cy="32" r="1.5" fill="#1B5E20" opacity="0.9"/>
    <circle cx="46" cy="32" r="1.5" fill="#1B5E20" opacity="0.9"/>
    <circle cx="32" cy="46" r="1.5" fill="#1B5E20" opacity="0.9"/>
    <circle cx="28" cy="36" r="1" fill="#1B5E20" opacity="0.8"/>
    <circle cx="36" cy="28" r="1" fill="#1B5E20" opacity="0.8"/>
    <ellipse cx="24" cy="26" rx="5" ry="5" fill="white"/>
    <ellipse cx="40" cy="26" rx="5" ry="5" fill="white"/>
    <circle cx="24" cy="26" r="2.5" fill="black"/>
    <circle cx="40" cy="26" r="2.5" fill="black"/>
    <circle cx="25" cy="25" r="1" fill="white"/>
    <circle cx="41" cy="25" r="1" fill="white"/>
    <path d="M26,38 Q32,44 38,38" stroke="black" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <ellipse cx="16" cy="32" rx="3" ry="2" fill="#F8BBD0" opacity="0.6"/>
    <ellipse cx="48" cy="32" rx="3" ry="2" fill="#F8BBD0" opacity="0.6"/>
</svg>`
	}
}

// Fruit spawning probability (for random drops)
export const FRUIT_SPAWN_WEIGHTS = {
	BLUEBERRY: 0.4,    // 40% chance
	STRAWBERRY: 0.3,   // 30% chance
	GRAPE: 0.2,        // 20% chance
	ORANGE: 0.1        // 10% chance
	// Higher fruits only through merging
}

export const POINTS_CONFIG = {
	DURATION: 2000,
	MAX_DISTANCE: 100,
}

// Combo configuration
export const COMBO_CONFIG = {
	resetDelay: 3000,
	minComboForDisplay: 2,
	scoreMultipliers: {
		1: 1.0,   // Single merge
		2: 1.2,   // 2x combo = 20% bonus
		3: 1.5,   // 3x combo = 50% bonus
		4: 1.8,   // 4x combo = 80% bonus
		5: 2.0,   // 5x combo = 100% bonus
		6: 2.2,   // 6x combo = 120% bonus
		7: 2.5,   // 7x combo = 150% bonus
		8: 2.8,   // 8x combo = 180% bonus
		9: 3.0,   // 9x combo = 200% bonus
		10: 3.5   // 10+ combo = 250% bonus
	},
	comboMessage: {
		2: 'GO GO Combo!',
		5: 'Amazing Combo!',
		10: 'Incredible Combo!',
		15: 'LEGENDARY COMBO!'
	},
	comboColor: {
		2: '#fdcb6e',  // Yellow
		3: '#e17055',  // Orange
		4: '#e84393',  // Pink
		5: '#a29bfe',  // Purple
		6: '#6c5ce7',  // Deep purple
		7: '#fd79a8',  // Hot pink
		8: '#e84393',  // Magenta
		9: '#9b59b6',  // Royal purple
		10: '#8e44ad' // Deep purple
	}
}

// Level Goal Configuration
export const FRUIT_MERGE_LEVELS = {
	1: {
		targetFruit: 'APPLE',
		gameOverHeight: 100,
		title: 'Easy',
		description: "Erstelle einen Apfel",
		starThresholds: {
			1: { targetFruit: 'APPLE', moves: 30 },
			2: { targetFruit: 'APPLE', moves: 20 },
			3: { targetFruit: 'APPLE', moves: 12 },
		}
	},
	2: {
		targetFruit: 'APPLE',
		gameOverHeight: 100,
		title: 'Medium',
		description: "Erstelle zwei Äpfel",
		starThresholds: {
			1: { targetFruit: 'APPLE', targetCount: 2, moves: 35 },
			2: { targetFruit: 'APPLE', targetCount: 2, moves: 25 },
			3: { targetFruit: 'APPLE', targetCount: 2, moves: 15 }
		}
	},
	3: {
		targetFruit: 'PEACH',
		gameOverHeight: 100,
		title: 'Hard',
		description: "Erstelle zwei Pfirsiche",
		starThresholds: {
			1: { targetFruit: 'PEACH', targetCount: 2, moves: 50 },
			2: { targetFruit: 'PEACH', targetCount: 2, moves: 40 },
			3: { targetFruit: 'PEACH', targetCount: 2, moves: 30 }
		}
	},
	4: {
		targetFruit: 'PINEAPPLE',
		gameOverHeight: 100,
		title: 'Expert',
		description: "Erstelle eine Ananas",
		starThresholds: {
			1: { targetFruit: 'PINEAPPLE', moves: 60 },
			2: { targetFruit: 'PINEAPPLE', moves: 50 },
			3: { targetFruit: 'PINEAPPLE', moves: 40 }
		}
	},
	5: {
		targetFruit: 'APPLE',
		gameOverHeight: 100,
		title: 'Master',
		description: "Erstelle zehn Äpfel",
		starThresholds: {
			1: { targetFruit: 'APPLE', targetCount: 10, moves: 80 },
			2: { targetFruit: 'APPLE', targetCount: 10, moves: 70 },
			3: { targetFruit: 'APPLE', targetCount: 10, moves: 60 }
		}
	},
	6: {
		targetFruit: 'COCONUT',
		gameOverHeight: 30,
		title: 'Legend',
		description: "Erstelle eine Kokosnuss",
		starThresholds: {
			1: { targetFruit: 'COCONUT', moves: 100 },
			2: { targetFruit: 'COCONUT', moves: 90 },
			3: { targetFruit: 'COCONUT', moves: 80 }
		}
	},
	7: {
		targetFruit: 'COCONUT',
		gameOverHeight: 30,
		title: 'Ultimate',
		description: "Erstelle zwei Kokosnüsse",
		starThresholds: {
			1: { targetFruit: 'COCONUT', targetCount: 2, moves: 120 },
			2: { targetFruit: 'COCONUT', targetCount: 2, moves: 110 },
			3: { targetFruit: 'COCONUT', targetCount: 2, moves: 100 }
		}
	},
	8: {
		targetFruit: 'MELON',
		gameOverHeight: 30,
		title: 'Epic',
		description: "Erstelle eine Melone",
		starThresholds: {
			1: { targetFruit: 'MELON', moves: 150 },
			2: { targetFruit: 'MELON', moves: 140 },
			3: { targetFruit: 'MELON', moves: 130 }
		}
	},
	9: {
		targetFruit: 'MELON',
		gameOverHeight: 30,
		title: 'Legendary',
		description: "Erstelle zwei Melonen",
		starThresholds: {
			1: { targetFruit: 'MELON', targetCount: 2, moves: 200 },
			2: { targetFruit: 'MELON', targetCount: 2, moves: 180 },
			3: { targetFruit: 'MELON', targetCount: 2, moves: 160 }
		}
	},
}

export const fruitMergeConfig = {
	gameId: 'fruitMerge',
	gameTitle: 'Fruit Merge',
	gameDescription: 'Merge fruits to create new combinations',
	gameIcon: 'fruit-merge-game',
	levels: Object.values(FRUIT_MERGE_LEVELS).map((level, index) => ({
		level: index + 1,
		...level
	}))
}
