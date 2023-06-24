/* eslint-disable no-nested-ternary */
import React, { useCallback, useState } from 'react'
import useMatch from '@/hooks/useMatch'
import {
  MatchRound,
  NextRoundTypeEnum,
  PlayerIndex,
  PlayerResult,
  PlayerResultWinnerOrLoserEnum,
  RoundResultTypeEnum,
} from '@/models'
import { useConfirmDialog } from '@/components/ConfirmDialog/provider'
import MJMatchRonDialog, {
  MJMatchRonProps,
} from '@/components/MJMatchRonDialog'
import {
  formatPlayerResultsByPreviousPlayerResults,
  generateMatchRoundCode,
  getIsPlayerEast,
  getPlayerIndexOfEastByRound,
} from '@/helpers/mahjong.helper'
import { useBoolean } from 'react-use'
import MJPlayerCardDiv, {
  MJPlayerCardMainColorMap,
} from '@/components/MJPlayerCardDiv'
import MJTileDiv, { MJTileKey } from '@/components/MJTileDiv'
import MJMatchCounterSpan from '@/components/MJMatchCounterSpan'
import MJTileKeyboardDiv from '@/components/MJTileKeyboardDiv'
import MJMatchHistoryTable from '@/components/MJMatchHistoryTable'
import MJMatchExhaustedDialog from '@/components/MJMatchExhaustedDialog'
import MJUIDialogV2 from '@/components/MJUI/MJUIDialogV2'
import MJUIButton from '@/components/MJUI/MJUIButton'

type Props = {
  params: { matchId: string }
}

export default function MatchControlPage({ params: { matchId } }: Props) {
  const {
    match,
    matchCurrentRound,
    matchCurrentRoundDoras,
    updateCurrentMatchRound,
    pushMatchRound,
    setCurrentRoundDoras,
  } = useMatch(matchId)

  const [clickedDoraIndex, setClickedDoraIndex] = useState<number | undefined>(
    undefined
  )

  const [isShowingRonDialog, toggleRonDialog] = useBoolean(false)
  const [ronDialogProps, setRonDialogProps] = useState<
    Pick<MJMatchRonProps, 'initialActivePlayerIndex'>
  >({ initialActivePlayerIndex: '0' })
  const confirmDialog = useConfirmDialog()

  const [isShowingExhaustedDialog, toggleExhaustedDialog] = useBoolean(false)

  const handleClickReveal = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      const playerIndex = e.currentTarget.getAttribute(
        'data-player-index'
      ) as unknown as PlayerIndex
      if (!playerIndex) {
        return
      }

      const player = match?.players[playerIndex]
      if (!player) {
        return
      }

      updateCurrentMatchRound({
        playerResults: {
          ...(matchCurrentRound?.playerResults as Record<
            PlayerIndex,
            PlayerResult
          >),
          [playerIndex]: {
            ...matchCurrentRound?.playerResults[playerIndex],
            isRevealed:
              !matchCurrentRound?.playerResults[playerIndex].isRevealed,
          },
        },
      })
    },
    [match?.players, matchCurrentRound?.playerResults, updateCurrentMatchRound]
  )

  const handleClickRiichi = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      const playerIndex = e.currentTarget.getAttribute(
        'data-player-index'
      ) as unknown as PlayerIndex
      if (!playerIndex) {
        return
      }

      const player = match?.players[playerIndex]
      if (!player) {
        return
      }

      confirmDialog.showConfirmDialog({
        title: '確定要立直嗎？',
        content: `一旦點擊確定，就會播出立直動畫，請確定立直的是 ${player.name}！`,
        onClickOk: async () => {
          updateCurrentMatchRound({
            playerResults: {
              ...(matchCurrentRound?.playerResults as Record<
                PlayerIndex,
                PlayerResult
              >),
              [playerIndex]: {
                ...matchCurrentRound?.playerResults[playerIndex],
                isRiichi: true,
              },
            },
          })
          return new Promise((res) => {
            setTimeout(res, 3000)
          })
        },
      })
    },
    [
      confirmDialog,
      match?.players,
      matchCurrentRound?.playerResults,
      updateCurrentMatchRound,
    ]
  )

  const handleClickDora = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      const doraIndex = parseInt(
        e.currentTarget?.getAttribute('data-index') as string,
        10
      )

      if (typeof doraIndex !== 'undefined' && !Number.isNaN(doraIndex)) {
        setClickedDoraIndex(doraIndex)
      }
    },
    []
  )

  const handleSubmitDoraKeyboard = useCallback(
    (tileKey: MJTileKey) => {
      if (typeof clickedDoraIndex !== 'undefined') {
        const newDoras = [...matchCurrentRoundDoras]

        if (clickedDoraIndex === -1) {
          newDoras.push(tileKey)
        } else {
          newDoras[clickedDoraIndex] = tileKey
        }

        setCurrentRoundDoras(newDoras)
        setClickedDoraIndex(undefined)
      }
    },
    [clickedDoraIndex, matchCurrentRoundDoras, setCurrentRoundDoras]
  )

  const handleRemoveDoraKeyboard = useCallback(() => {
    if (typeof clickedDoraIndex !== 'undefined') {
      const newDoras = [...matchCurrentRoundDoras]

      if (clickedDoraIndex > -1) {
        newDoras.splice(clickedDoraIndex, 1)
        setCurrentRoundDoras(newDoras)
        setClickedDoraIndex(undefined)
      }
    }
  }, [clickedDoraIndex, matchCurrentRoundDoras, setCurrentRoundDoras])

  const handleCloseDoraKeyboard = useCallback(() => {
    setClickedDoraIndex(undefined)
  }, [])

  const handleClickRon = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      const playerIndex = e?.currentTarget.getAttribute(
        'data-player-index'
      ) as PlayerIndex

      if (!playerIndex) {
        return
      }

      setRonDialogProps({
        initialActivePlayerIndex: playerIndex,
      })
      toggleRonDialog()
    },
    [toggleRonDialog]
  )

  const handleClickExhausted = useCallback(() => {
    toggleExhaustedDialog()
  }, [toggleExhaustedDialog])

  const handleSubmitMatchRonDialog = useCallback(
    (updatedMatchRound: MatchRound) => {
      try {
        // Check if match is over
        const eastPlayerIndex = getPlayerIndexOfEastByRound(
          updatedMatchRound.roundCount
        )
        const isGoExtendedRound =
          updatedMatchRound.playerResults[eastPlayerIndex].type ===
          PlayerResultWinnerOrLoserEnum.Win
        const isGameEnded =
          !isGoExtendedRound && updatedMatchRound.roundCount >= 8

        if (isGameEnded) {
          // TODO: Proceed to Game End
          alert('對局結束。')
        }

        updateCurrentMatchRound({
          ...updatedMatchRound,
          nextRoundType: isGameEnded
            ? NextRoundTypeEnum.End
            : isGoExtendedRound
            ? NextRoundTypeEnum.Extended
            : NextRoundTypeEnum.Normal,
        })
        toggleRonDialog(false)
      } catch (e) {
        console.error(e)
      }
    },
    [toggleRonDialog, updateCurrentMatchRound]
  )

  const handleSubmitMatchExhaustedDialog = useCallback(
    (updatedMatchRound: MatchRound) => {
      try {
        const eastPlayerIndex = getPlayerIndexOfEastByRound(
          updatedMatchRound.roundCount
        )
        const isGoExtendedRound =
          updatedMatchRound.playerResults[eastPlayerIndex].type ===
          PlayerResultWinnerOrLoserEnum.Win
        const isGameEnded =
          !isGoExtendedRound && updatedMatchRound.roundCount >= 8

        if (isGameEnded) {
          // TODO: Proceed to Game End
          alert('對局結束。')
        }

        updateCurrentMatchRound({
          ...updatedMatchRound,
          nextRoundType: isGameEnded
            ? NextRoundTypeEnum.End
            : isGoExtendedRound
            ? NextRoundTypeEnum.Extended
            : NextRoundTypeEnum.Normal,
        })
        toggleExhaustedDialog(false)
      } catch (e) {
        console.error(e)
      }
    },
    [toggleExhaustedDialog, updateCurrentMatchRound]
  )

  const handleClickGoNextRound = useCallback(() => {
    if (!matchCurrentRound) {
      return
    }

    const newRoundCount =
      matchCurrentRound.nextRoundType === NextRoundTypeEnum.Normal
        ? matchCurrentRound.roundCount + 1
        : matchCurrentRound.roundCount

    const newExtendedRoundCount =
      matchCurrentRound.nextRoundType === NextRoundTypeEnum.Extended
        ? matchCurrentRound.extendedRoundCount + 1
        : 0

    const newMatchRound: MatchRound = {
      matchId,
      code: generateMatchRoundCode(
        matchId,
        newRoundCount,
        newExtendedRoundCount
      ),
      roundCount: newRoundCount,
      extendedRoundCount: newExtendedRoundCount,
      cumulatedThousands: 0,
      resultType: RoundResultTypeEnum.Unknown,
      nextRoundType: NextRoundTypeEnum.Unknown,
      playerResults: formatPlayerResultsByPreviousPlayerResults(
        matchCurrentRound.playerResults
      ),
      doras: {},
    }

    pushMatchRound(newMatchRound)
  }, [matchCurrentRound, matchId, pushMatchRound])

  if (!match || !matchCurrentRound) {
    return <div>對局讀取失敗。</div>
  }

  return (
    <div>
      <div className="container mx-auto my-8 px-8 space-y-6">
        <div className="flex flex-row items-stretch gap-x-4 text-white">
          <div className="shrink-0 rounded-[1rem] bg-black bg-opacity-50 p-2 flex items-stretch gap-x-4">
            <div className="font-ud text-[2.5rem] border-[.25rem] rounded-[.75rem] px-4 border-current flex items-center justify-center">
              <MJMatchCounterSpan
                roundCount={matchCurrentRound.roundCount}
                max={8}
              />
            </div>
            <div className="flex flex-col justify-around">
              <div className="flex-1 flex flex-row items-center gap-x-2">
                <div className="flex-1">
                  <img
                    src="/images/score-hundred.png"
                    alt="hundred"
                    className="h-4"
                  />
                </div>
                <div className="font-ud">
                  {matchCurrentRound.extendedRoundCount ?? 0}
                </div>
              </div>
              <div className="flex-1 flex flex-row items-center gap-x-2">
                <div className="flex-1">
                  <img
                    src="/images/score-thousand.png"
                    alt="thousand"
                    className="h-4"
                  />
                </div>
                <div className="font-ud">
                  {matchCurrentRound.cumulatedThousands ?? 0}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-x-2">
              {matchCurrentRoundDoras.map((dora, index) => (
                <MJTileDiv
                  key={dora}
                  className="w-9 cursor-pointer"
                  data-index={index}
                  onClick={handleClickDora}
                >
                  {dora}
                </MJTileDiv>
              ))}
              <div>
                <MJUIButton
                  type="button"
                  color="secondary"
                  className={`${
                    matchCurrentRoundDoras.length === 0 && 'animate-bounce'
                  }`}
                  data-index="-1"
                  onClick={handleClickDora}
                >
                  +懸賞
                </MJUIButton>
              </div>
            </div>
          </div>
          <div className="flex-1" />
          <div className="shrink-0 space-x-4">
            {(matchCurrentRound.nextRoundType === NextRoundTypeEnum.Normal ||
              matchCurrentRound.nextRoundType ===
                NextRoundTypeEnum.Extended) && (
              <MJUIButton
                color="success"
                type="button"
                className="animate-pulse"
                onClick={handleClickGoNextRound}
              >
                進入
                <MJMatchCounterSpan
                  roundCount={
                    matchCurrentRound.nextRoundType === NextRoundTypeEnum.Normal
                      ? matchCurrentRound.roundCount + 1
                      : matchCurrentRound.roundCount
                  }
                  extendedRoundCount={
                    matchCurrentRound.nextRoundType ===
                    NextRoundTypeEnum.Extended
                      ? matchCurrentRound.extendedRoundCount + 1
                      : 0
                  }
                />
              </MJUIButton>
            )}
            <MJUIButton
              color="secondary"
              type="button"
              onClick={handleClickExhausted}
            >
              流局
            </MJUIButton>
          </div>
        </div>

        <div className="space-y-4">
          {(['0', '1', '2', '3'] as PlayerIndex[]).map((index) => (
            <div className="flex gap-x-2 items-center">
              <div className="flex-1 text-[2.5rem]">
                <MJPlayerCardDiv
                  name={match.players[index].name}
                  title={match.players[index].title}
                  propicSrc={match.players[index].propicSrc}
                  score={matchCurrentRound.playerResults[index].afterScore}
                  scoreChanges={
                    matchCurrentRound.playerResults[index].scoreChanges
                  }
                  isEast={getIsPlayerEast(index, matchCurrentRound.roundCount)}
                  isRiichi={matchCurrentRound.playerResults[index].isRiichi}
                  color={MJPlayerCardMainColorMap[index]}
                />
              </div>
              <div>
                <button
                  type="button"
                  className={`${
                    matchCurrentRound.playerResults[index].isRevealed
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-blue-600 opacity-30'
                  } h-16 w-16 border-2 border-blue-600  rounded-full text-lg`}
                  onClick={handleClickReveal}
                  data-player-index={index}
                >
                  {matchCurrentRound.playerResults[index].isRevealed
                    ? '已副露'
                    : '副露?'}
                </button>
              </div>
              <div>
                <button
                  type="button"
                  className={`${
                    matchCurrentRound.playerResults[index].isRiichi
                      ? 'bg-orange-600 text-white'
                      : 'bg-white text-orange-600 opacity-30'
                  } h-16 w-16 border-2 border-orange-600  rounded-full text-lg`}
                  onClick={handleClickRiichi}
                  data-player-index={index}
                >
                  {matchCurrentRound.playerResults[index].isRiichi
                    ? '已立直'
                    : '立直?'}
                </button>
              </div>
              <div className="pl-6">
                <MJUIButton
                  color="danger"
                  type="button"
                  onClick={handleClickRon}
                  data-player-index={index}
                >
                  和了
                </MJUIButton>
              </div>
            </div>
          ))}
        </div>

        <MJMatchHistoryTable matchId={matchId} className="w-full table-auto" />
      </div>

      <MJUIDialogV2
        open={typeof clickedDoraIndex !== 'undefined'}
        title="選擇懸賞"
        onClose={handleCloseDoraKeyboard}
      >
        <MJTileKeyboardDiv
          hideRedTiles
          onSubmit={handleSubmitDoraKeyboard}
          onRemove={handleRemoveDoraKeyboard}
          canRemove={
            typeof clickedDoraIndex !== 'undefined' && clickedDoraIndex > 0
          }
        />
      </MJUIDialogV2>

      <MJMatchRonDialog
        match={match}
        currentMatchRound={matchCurrentRound}
        open={isShowingRonDialog}
        onSubmit={handleSubmitMatchRonDialog}
        onClose={() => toggleRonDialog(false)}
        {...ronDialogProps}
      />

      <MJMatchExhaustedDialog
        match={match}
        currentMatchRound={matchCurrentRound}
        open={isShowingExhaustedDialog}
        onSubmit={handleSubmitMatchExhaustedDialog}
        onClose={() => toggleExhaustedDialog(false)}
        {...ronDialogProps}
      />
    </div>
  )
}
