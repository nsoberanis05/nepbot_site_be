function handleBet(bet, userJades) {
  if (bet > userJades || bet <= 0 || typeof bet !== "number") return false;

  return true;
}

export default handleBet;
