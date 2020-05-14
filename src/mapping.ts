import { BigInt } from '@graphprotocol/graph-ts'

// Events.
import {
  StartVote as StartVoteEvent,
  CastVote as CastVoteEvent,
  ExecuteVote as ExecuteVoteEvent
} from '../generated/Voting/Voting'

// Contracts.
import {
  Voting as VotingContract
} from '../generated/Voting/Voting'

// Schema.
import {
  Vote as VoteEntity,
  Cast as CastEntity
} from '../generated/schema'

// StartVote(uint256 indexed voteId, address indexed creator, string metadata)
export function handleStartVote(event: StartVoteEvent): void {
  // Create vote entity.
  let voteId = event.params.voteId
  let vote = new VoteEntity(voteId.toHex())

  // Properties extracted from the event.
  vote.creator = event.params.creator
  vote.metadata = event.params.metadata

  // Properties extracted from the contract.
  let voting = VotingContract.bind(event.address)
  let voteData = voting.getVote(voteId)
  vote.open = voteData.value0
  vote.executed = voteData.value1
  vote.startDate = voteData.value2
  vote.snapshotBlock = voteData.value3
  vote.supportRequiredPct = voteData.value4
  vote.minAcceptQuorum = voteData.value5
  vote.yea = voteData.value6
  vote.nay = voteData.value7
  vote.votingPower = voteData.value8
  vote.script = voteData.value9

  // Other properties.
  vote.executed = false
  vote.casts = []

  vote.save()
}

// CastVote(uint256 indexed voteId, address indexed voter, bool supports, uint256 stake)
export function handleCastVote(event: CastVoteEvent): void {
  // Identify parent vote entity.
  let voteId = event.params.voteId
  let vote = VoteEntity.load(voteId.toHex())
  let numCasts = vote.casts.length

  // Create cast entity.
  let castId = voteId.toHex() + '-' + numCasts.toString()
  let cast = new CastEntity(castId)

  // Properties extracted from the event.
  cast.voteId = voteId.toHex()
  cast.voter = event.params.voter
  cast.supports = event.params.supports
  cast.voterStake = event.params.stake
  cast.save()

  // Register the cast in the parent vote entity.
  let casts = vote.casts
  casts.push(castId)
  vote.casts = casts
  vote.save()
}

// ExecuteVote(uint256 indexed voteId)
export function handleExecuteVote(event: ExecuteVoteEvent): void {
  // Identify associated vote entity.
  let voteId = event.params.voteId
  let vote = VoteEntity.load(voteId.toHex())

  // Mark it as executed.
  vote.executed = true
  vote.save()
}