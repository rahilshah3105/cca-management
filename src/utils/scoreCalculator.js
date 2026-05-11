// Score calculation utilities for Cricket Scorecard

const normalizeId = (value) => (value === null || value === undefined ? '' : String(value));

const findPlayer = (team1Players, team2Players, id) => {
  const targetId = normalizeId(id);
  if (!targetId) return null;

  const all = [...(team1Players || []), ...(team2Players || [])];
  return all.find((player) => normalizeId(player.id) === targetId || normalizeId(player.playerId) === targetId || normalizeId(player.value) === targetId) || null;
};

export const getPlayerName = (team1Players, team2Players, id) => {
  const player = findPlayer(team1Players, team2Players, id);
  return player?.name || player?.label || 'Unknown';
};

export const calculateBattingStats = (balls, playerId) => {
  const targetId = normalizeId(playerId);
  const playerBalls = balls.filter(b => normalizeId(b.batsmanId) === targetId);
  const runs = playerBalls.reduce((sum, b) => {
    if (b.extraType === 'wide') return sum;
    return sum + (b.runsScored || 0);
  }, 0);
  const ballsFaced = playerBalls.filter(b => b.extraType !== 'wide').length;
  const fours = playerBalls.filter(b => !b.extraType && b.runsScored === 4).length;
  const sixes = playerBalls.filter(b => !b.extraType && b.runsScored === 6).length;
  const sr = ballsFaced > 0 ? ((runs / ballsFaced) * 100).toFixed(1) : '-';
  const dismissalBall = balls.find(b => b.isWicket && normalizeId(b.batsmanId) === targetId);
  return { runs, ballsFaced, fours, sixes, sr, isOut: !!dismissalBall, dismissal: dismissalBall || null };
};

export const getDismissalText = (ball, team1Players, team2Players) => {
  if (!ball) return 'not out';
  const bowlerName = getPlayerName(team1Players, team2Players, ball.bowlerId);
  const fielderName = ball.fielderId ? getPlayerName(team1Players, team2Players, ball.fielderId) : '';
  switch (ball.wicketType) {
    case 'bowled': return `b ${bowlerName}`;
    case 'caught': return `c ${fielderName} b ${bowlerName}`;
    case 'lbw': return `lbw b ${bowlerName}`;
    case 'runout': return `run out (${fielderName})`;
    case 'stumped': return `st ${fielderName} b ${bowlerName}`;
    case 'hitwicket': return `hit wicket b ${bowlerName}`;
    default: return 'out';
  }
};

export const calculateBowlingStats = (balls, bowlerId) => {
  const targetId = normalizeId(bowlerId);
  const bowlerBalls = balls.filter(b => normalizeId(b.bowlerId) === targetId);
  const legalBalls = bowlerBalls.filter(b => b.extraType !== 'wide' && b.extraType !== 'noball').length;
  const overs = `${Math.floor(legalBalls / 6)}.${legalBalls % 6}`;
  const runs = bowlerBalls.reduce((sum, b) => {
    if (b.extraType === 'bye' || b.extraType === 'legbye') return sum;
    let r = b.runsScored || 0;
    if (b.extraType === 'wide' || b.extraType === 'noball') r += (b.extraRuns || 1);
    return sum + r;
  }, 0);
  const wickets = bowlerBalls.filter(b => b.isWicket && b.wicketType !== 'runout').length;
  const econ = legalBalls > 0 ? ((runs / (legalBalls / 6))).toFixed(2) : '0.00';
  // Maidens
  const overMap = {};
  bowlerBalls.filter(b => b.extraType !== 'wide' && b.extraType !== 'noball').forEach(b => {
    if (!overMap[b.overNumber]) overMap[b.overNumber] = [];
    overMap[b.overNumber].push(b);
  });
  const maidens = Object.values(overMap).filter(ob => ob.length === 6 && ob.reduce((s, b) => s + (b.runsScored || 0), 0) === 0).length;
  return { overs, runs, wickets, maidens, econ };
};

export const calculateInningsTotal = (balls) => {
  let runs = 0, wickets = 0, legalBalls = 0;
  let wide = 0, noBall = 0, bye = 0, legBye = 0;
  balls.forEach(b => {
    if (b.extraType === 'wide') { wide += (b.extraRuns || 1); runs += (b.extraRuns || 1); }
    else if (b.extraType === 'noball') { noBall += (b.extraRuns || 1); runs += (b.runsScored || 0) + (b.extraRuns || 1); legalBalls++; }
    else if (b.extraType === 'bye') { bye += (b.extraRuns || 0); runs += (b.extraRuns || 0); legalBalls++; }
    else if (b.extraType === 'legbye') { legBye += (b.extraRuns || 0); runs += (b.extraRuns || 0); legalBalls++; }
    else { runs += (b.runsScored || 0); legalBalls++; }
    if (b.isWicket) wickets++;
  });
  return {
    runs, wickets, legalBalls,
    overs: `${Math.floor(legalBalls / 6)}.${legalBalls % 6}`,
    extras: { wide, noBall, bye, legBye, total: wide + noBall + bye + legBye }
  };
};

export const getFallOfWickets = (balls) => {
  const fow = [];
  let runs = 0;
  balls.forEach(b => {
    if (b.extraType === 'wide') runs += (b.extraRuns || 1);
    else if (b.extraType === 'noball') runs += (b.runsScored || 0) + (b.extraRuns || 1);
    else if (b.extraType === 'bye' || b.extraType === 'legbye') runs += (b.extraRuns || 0);
    else runs += (b.runsScored || 0);
    if (b.isWicket) fow.push({ wicket: fow.length + 1, runs, batsmanId: b.batsmanId, over: `${b.overNumber}.${b.ballNumber}` });
  });
  return fow;
};

export const getBattingOrder = (balls) => {
  const order = [], seen = new Set();
  balls.forEach(b => {
    const batsmanId = normalizeId(b.batsmanId);
    const nonStrikerId = normalizeId(b.nonStrikerId);
    if (batsmanId && !seen.has(batsmanId)) { seen.add(batsmanId); order.push(batsmanId); }
    if (nonStrikerId && !seen.has(nonStrikerId)) { seen.add(nonStrikerId); order.push(nonStrikerId); }
  });
  return order;
};

export const getBowlingOrder = (balls) => {
  const order = [], seen = new Set();
  balls.forEach(b => {
    const bowlerId = normalizeId(b.bowlerId);
    if (bowlerId && !seen.has(bowlerId)) { seen.add(bowlerId); order.push(bowlerId); }
  });
  return order;
};
