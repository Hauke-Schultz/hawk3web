// A* Pathfinding algorithm for HawkDungeon
export function usePathfinding(levelLoader, monsters) {
  /**
   * A* pathfinding algorithm
   * @param {number} startX - Starting grid X
   * @param {number} startY - Starting grid Y
   * @param {number} goalX - Goal grid X
   * @param {number} goalY - Goal grid Y
   * @returns {Array} - Array of directions to reach goal, or empty array if no path
   */
  const findPath = (startX, startY, goalX, goalY) => {
    // If start equals goal, no movement needed
    if (startX === goalX && startY === goalY) {
      return []
    }

    // Check if goal is walkable
    if (!levelLoader.isWalkable(goalX, goalY)) {
      console.log('Goal position is not walkable')
      return []
    }

    // Check if goal is occupied by a monster
    if (isOccupiedByMonster(goalX, goalY)) {
      console.log('Goal position is occupied by a monster')
      return []
    }

    const openSet = []
    const closedSet = new Set()
    const cameFrom = new Map()
    const gScore = new Map()
    const fScore = new Map()

    const startKey = `${startX},${startY}`
    const goalKey = `${goalX},${goalY}`

    gScore.set(startKey, 0)
    fScore.set(startKey, heuristic(startX, startY, goalX, goalY))

    openSet.push({ x: startX, y: startY, f: fScore.get(startKey) })

    while (openSet.length > 0) {
      // Get node with lowest fScore
      openSet.sort((a, b) => a.f - b.f)
      const current = openSet.shift()
      const currentKey = `${current.x},${current.y}`

      // Goal reached
      if (current.x === goalX && current.y === goalY) {
        return reconstructPath(cameFrom, currentKey, startKey)
      }

      closedSet.add(currentKey)

      // Check all neighbors
      const neighbors = getNeighbors(current.x, current.y)
      for (const neighbor of neighbors) {
        const neighborKey = `${neighbor.x},${neighbor.y}`

        if (closedSet.has(neighborKey)) {
          continue
        }

        // Check if neighbor is walkable
        if (!levelLoader.isWalkable(neighbor.x, neighbor.y)) {
          continue
        }

        // Check if neighbor is occupied by monster (unless it's the goal)
        if (neighborKey !== goalKey && isOccupiedByMonster(neighbor.x, neighbor.y)) {
          continue
        }

        const tentativeGScore = (gScore.get(currentKey) || Infinity) + 1

        if (!gScore.has(neighborKey) || tentativeGScore < gScore.get(neighborKey)) {
          cameFrom.set(neighborKey, { x: current.x, y: current.y })
          gScore.set(neighborKey, tentativeGScore)
          const f = tentativeGScore + heuristic(neighbor.x, neighbor.y, goalX, goalY)
          fScore.set(neighborKey, f)

          // Add to openSet if not already there
          if (!openSet.some(node => node.x === neighbor.x && node.y === neighbor.y)) {
            openSet.push({ x: neighbor.x, y: neighbor.y, f })
          }
        }
      }
    }

    // No path found
    console.log('No path found to target')
    return []
  }

  /**
   * Get neighbors of a position (4-directional)
   */
  const getNeighbors = (x, y) => {
    return [
      { x: x, y: y - 1 }, // up
      { x: x, y: y + 1 }, // down
      { x: x - 1, y: y }, // left
      { x: x + 1, y: y }  // right
    ]
  }

  /**
   * Manhattan distance heuristic
   */
  const heuristic = (x1, y1, x2, y2) => {
    return Math.abs(x1 - x2) + Math.abs(y1 - y2)
  }

  /**
   * Check if a position is occupied by a monster
   */
  const isOccupiedByMonster = (x, y) => {
    return monsters.value.some(monster => {
      if (monster.state === 'dead') return false

      const monsterWidth = monster.gridWidth || 1
      const monsterHeight = monster.gridHeight || 1

      for (let dy = 0; dy < monsterHeight; dy++) {
        for (let dx = 0; dx < monsterWidth; dx++) {
          if (monster.gridX + dx === x && monster.gridY + dy === y) {
            return true
          }
          if (monster.isMovingToTarget &&
              monster.targetGridX + dx === x &&
              monster.targetGridY + dy === y) {
            return true
          }
        }
      }
      return false
    })
  }

  /**
   * Reconstruct path from cameFrom map
   */
  const reconstructPath = (cameFrom, currentKey, startKey) => {
    const path = []
    let key = currentKey

    while (cameFrom.has(key)) {
      const current = parseKey(key)
      const prev = cameFrom.get(key)

      // Determine direction from prev to current
      const direction = getDirection(prev.x, prev.y, current.x, current.y)
      path.unshift(direction)

      key = `${prev.x},${prev.y}`

      if (key === startKey) {
        break
      }
    }

    return path
  }

  /**
   * Get direction from one position to another
   */
  const getDirection = (fromX, fromY, toX, toY) => {
    if (toX > fromX) return 'right'
    if (toX < fromX) return 'left'
    if (toY > fromY) return 'down'
    if (toY < fromY) return 'up'
    return null
  }

  /**
   * Parse a key string to coordinates
   */
  const parseKey = (key) => {
    const [x, y] = key.split(',').map(Number)
    return { x, y }
  }

  return {
    findPath
  }
}

export default usePathfinding
