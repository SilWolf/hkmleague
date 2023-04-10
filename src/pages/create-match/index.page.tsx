import MJPositionSpan from '@/components/MJPositionSpan'
import { MatchRound, Player, PlayerIndex } from '@/models'
import React, { useCallback, useState } from 'react'
import MJInlineEditButton from '@/components/MJInlineEditButton'
import { useFirebaseDatabase } from '@/providers/firebaseDatabase.provider'
import {
  generateMatchCode,
  generateMatchRoundCode,
} from '@/helpers/mahjong.helper'
import { useLocation } from 'wouter'

function CreateMatchPage() {
  const fb = useFirebaseDatabase()
  const [, setLocation] = useLocation()

  const [players, setPlayers] = useState<Record<PlayerIndex, Player>>({
    '0': {
      name: '玩家A',
    },
    '1': {
      name: '玩家B',
    },
    '2': {
      name: '玩家C',
    },
    '3': {
      name: '玩家D',
    },
  })

  const handleChange = useCallback(
    (newValue: string | null | undefined, e: React.MouseEvent) => {
      if (!e.currentTarget) {
        return
      }

      const playerIndex = e.currentTarget.getAttribute(
        'data-player-index'
      ) as PlayerIndex
      const column = e.currentTarget.getAttribute('data-column') as
        | 'name'
        | 'title'

      if (!playerIndex || !column) {
        return
      }

      setPlayers((prev) => ({
        ...prev,
        [playerIndex]: {
          ...players[playerIndex],
          [column]: newValue,
        },
      }))
    },
    [players]
  )

  const handleClickQRScan = useCallback(() => {
    alert('掃瞄QR Code功能未開放。')
  }, [])

  const handleClickEnterCode = useCallback(() => {
    alert('輸入會員編號功能未開放。')
  }, [])

  const handleClickStart = useCallback(async () => {
    const playerIds = await Promise.all(
      Object.values(players).map((player) => fb.push('players', player))
    ).then((result) => result.map((playerRef) => playerRef.key))

    // const matchId = getRandomId()
    const match = {
      code: generateMatchCode(),
      remark: '',
      createdAt: new Date().toISOString(),
      createdBy: 'Dicky',
      updatedAt: new Date().toISOString(),
      updatedBy: 'Dicky',
      setting: {
        template: 'mleague',
      },
      [`player_${playerIds[0]}`]: {
        position: 0,
        score: 25000,
        rank: 1,
        point: 0,
      },
      [`player_${playerIds[1]}`]: {
        position: 1,
        score: 25000,
        rank: 1,
        point: 0,
      },
      [`player_${playerIds[2]}`]: {
        position: 2,
        score: 25000,
        rank: 1,
        point: 0,
      },
      [`player_${playerIds[3]}`]: {
        position: 3,
        score: 25000,
        rank: 1,
        point: 0,
      },
    }

    const matchRef = await fb.push(`matches`, match)

    const matchRound: MatchRound = {
      matchId: matchRef.key as string,
      code: generateMatchRoundCode(match.code, 1, 0),
      roundCount: 1,
      extendedRoundCount: 0,
      cumulatedThousands: 0,
      resultType: 0,
      playerResults: {
        '0': {
          beforeScore: 25000,
          afterScore: 25000,
          type: 0,
          scoreChanges: [],
          prevScoreChanges: [],
        },
        '1': {
          beforeScore: 25000,
          afterScore: 25000,
          type: 0,
          scoreChanges: [],
          prevScoreChanges: [],
        },
        '2': {
          beforeScore: 25000,
          afterScore: 25000,
          type: 0,
          scoreChanges: [],
          prevScoreChanges: [],
        },
        '3': {
          beforeScore: 25000,
          afterScore: 25000,
          type: 0,
          scoreChanges: [],
          prevScoreChanges: [],
        },
      },
      doras: [],
    }

    await fb.push(`matchRounds`, matchRound)

    setLocation(`/match/${matchRound.matchId}/obs`)
  }, [fb, players, setLocation])

  return (
    <div className="container mx-auto max-w-screen-sm">
      <div className="min-h-screen flex flex-col py-16 gap-y-4">
        <div className="shrink-0">
          <a href="/" className="underline">
            &lt; 回上一頁
          </a>
        </div>
        <div className="flex-1">
          <div className="space-y-4">
            <h1 className="text-4xl">玩家</h1>
            <div className="space-y-4">
              {(['0', '1', '2', '3'] as PlayerIndex[]).map((playerIndex) => (
                <div key={playerIndex} className="flex items-center gap-x-2">
                  <div className="shrink-0">
                    <div className="h-14 w-14 border-4 rounded border-black text-[2.5rem] flex items-center justify-center">
                      <MJPositionSpan playerIndex={playerIndex} />
                    </div>
                  </div>
                  <div className="flex-1 flex items-center gap-x-2 bg-white bg-opacity-30 rounded p-2">
                    <div className="shrink-0">
                      <div
                        className="w-14 h-14 bg-center bg-contain"
                        style={{
                          backgroundImage: `url(${
                            players[playerIndex].propicSrc ??
                            '/images/portrait-placeholder.jpeg'
                          })`,
                        }}
                      />
                    </div>
                    <div className="flex-1">
                      <div>
                        <MJInlineEditButton
                          value={players[playerIndex].title}
                          placeholder="(無頭銜)"
                          data-player-index={playerIndex}
                          data-column="title"
                          onEdit={handleChange}
                        />
                      </div>
                      <div className="text-2xl">
                        <MJInlineEditButton
                          required
                          value={players[playerIndex].name}
                          data-player-index={playerIndex}
                          data-column="name"
                          onEdit={handleChange}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0 space-x-2">
                    <button
                      type="button"
                      data-player-index={playerIndex}
                      onClick={handleClickQRScan}
                    >
                      <span className="material-symbols-outlined">
                        qr_code_scanner
                      </span>
                    </button>
                    <button
                      type="button"
                      data-player-index={playerIndex}
                      onClick={handleClickEnterCode}
                    >
                      <span className="material-symbols-outlined">123</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="shrink-0 space-y-4">
          <button
            type="button"
            className="w-full bg-blue-600 text-white text-4xl p-4 rounded-lg"
            onClick={handleClickStart}
          >
            開始
          </button>
        </div>
      </div>
    </div>
  )
}

export default CreateMatchPage