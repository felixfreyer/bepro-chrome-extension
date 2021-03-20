var intervalId = window.setInterval(function(){
	fetch('https://api.coingecko.com/api/v3/simple/price?ids=bet-protocol&vs_currencies=usd&include_market_cap=true%C2%B4')
		.then(response => response.json())
		.then(data => setBadge(data));
  }, 5000);

function setBadge(data) {
	chrome.browserAction.setBadgeBackgroundColor({color: [0, 0, 0, 100]});
	var price = data['bet-protocol']['usd'].toString();
	chrome.browserAction.setBadgeText({text: price});
}
