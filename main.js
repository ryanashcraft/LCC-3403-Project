const COIN_PADDING = 20;

const COIN_VALUES = [3, 4];
const START_COIN_QUANTITY = 5;

var currentState = null;
var currentStamp = null;

var coinsInDish = [];

$(document).on("ready", function(e) {
	initStates();

	initLayout();
});

function initStates() {
	var eightCentState = createCoinState(8, null);
	var sevenCentState = createCoinState(7, eightCentState);
	var sixCentState = createCoinState(6, sevenCentState);

	currentState = sixCentState;
}

function createCoinState(stampPrice, nextState) {
	var state = new State();

	state.introMessage = "Pay for a " + stampPrice + " cent stamp with 3 and 4 cent coins.";
	state.validMessage = "You got the coin amount correct.<br/><br/>Good job!";

	state.stampPrice = stampPrice;
	state.validationMethod = function() {
		return getValueOfCoins(coinsInDish) == stampPrice;
	}
	state.rejectionMethod = function() {
		if (getValueOfCoins(coinsInDish) > stampPrice) {
			return "That's a bit too much. Try removing some coins.";
		}

		return null;
	}
	state.nextState = nextState;

	return state;
}

function initLayout() {
	$("#dish").position({
		of: $("#top"),
		my: "center center",
		at: "center center"
	});

	for (var i = 0; i < COIN_VALUES.length; i++) {
		for (var j = 0; j < START_COIN_QUANTITY; j++) {
			var coin = createCoin(COIN_VALUES[i]);
			var stack = $("#dish");

			$(".stack").each(function() {
				if (parseInt($(this).attr("data-value")) == COIN_VALUES[i]) {
					stack = $(this);
					return;
				}
			});

			coin.appendTo(stack);

			coin.position({
				of: stack,
				my: "center center",
				at: "center center"
			});

			coin.css("visibility", "hidden");
		}
	}

	setCurrentStamp(createStamp(currentState.stampPrice));

	showTopCoinInStacks();

	showDialog(currentState.introMessage);
}

function refreshLayout() {
	$(".coin").each(function() {
		var coin = $(this);
		var stack = $("#dish");

		$(".stack").each(function() {
			var stackValue = parseInt($(this).attr("data-value"));
			var coinValue = parseInt(coin.attr("data-value"));

			if (stackValue == coinValue) {
				stack = $(this);
				return;
			}
		});

		coin.position({
			of: stack,
			my: "center center",
			at: "center center"
		});

		coin.css("visibility", "hidden");
	});

	setCurrentStamp(createStamp(currentState.stampPrice));

	showTopCoinInStacks();
}

function refresh() {
	var coins = getCoinsInDish();

	if ((coins < coinsInDish) || (coins > coinsInDish)) {
		var quantity = coins.length;
		var value = getValueOfCoins(coins);

		console.log(quantity + " coin" + (quantity != 1 ? "s" : "") + " in " +
			"the dish for a total of " + value + " cents.");
		console.log("You " + (canPurchaseStamp(currentStamp) ? "can" : "cannot") + 
			" purchase the current stamp.");
		console.log("Cost of current stamp: " + currentStamp.attr("data-cost") +
			" cents.");

		coinsInDish = coins;

		if (currentState.validationMethod()) {
			moveStampToWallet(currentStamp);

			var validDialog = showDialog(currentState.validMessage);
			validDialog.bind( "dialogclose", function(event, ui) {

				currentState = currentState.nextState;
				refreshLayout();

				showDialog(currentState.introMessage);
			});
		}

		var rejectMessage = currentState.rejectionMethod();
		if (rejectMessage) {
			showDialog(rejectMessage);
		}
	}
}

function showDialog(content) {
	return $("<div></div>").html(content).dialog({
		title: "Message",
		draggable: false,
		open: function(event) {
			$(".stack .coin").each(function() {
				$(this).draggable("disable");
			});
			$("body").append("<div id='modal-overlay'></div>");
		},
		close: function(event) {
			$(".stack .coin").each(function() {
				$(this).draggable("enable");
			});

			$("#modal-overlay").remove();

			$(this).remove();
		}
	});
}

function showTopCoinInStacks() {
	$(".stack").each(function() {
		var coinsInStack = $(this).children().filter(function() {
			if (!$(this).hasClass("dragged")) {
				return true;
			}
		});

		coinsInStack.first().css("visibility", "visible");
	});
}

function getCoinsInDish() {
	var coins = [];

	$(".coin").each(function(e) {
		if (new $.rect($(this),{
		    position: 'offset',
		    dimension: 'outer',
		    withMargin: true
		}).intersects($("#dish"))) {
			coins.push(parseInt($(this).attr("data-value")));
		}
	});

	return coins;
}

function canPurchaseStamp(stamp) {
	if (!stamp) {
		return false;
	}

	var coins = getCoinsInDish();

	var value = 0;
	for (var i = 0; i < coins.length; i++) {
		value += coins[i];
	}

	return value == stamp.attr("data-cost");
}

function getValueOfCoins(coins) {
	if (!coins) {
		return 0;
	}

	var value = 0;

	for (var i = 0; i < coins.length; i++) {
		value += coins[i];
	}

	return value;
}

function moveStampToWallet(stamp) {
	var bottomChildren = $("#bottom").children();
	stamp.appendTo("#bottom").position({
		of: bottomChildren.eq(bottomChildren.length - 1),
		my: "left center",
		at: "right center",
		offset: "20 0"
	});
}

function setCurrentStamp(stamp) {
	if (!stamp) {
		return;
	}

	stamp.appendTo("#top").position({
		of: $("#top"),
		my: "left top",
		at: "left top",
		offset: "20 20"
	});

	currentStamp = stamp;
}

function createCoin(value) {
	var coin = $("<div>", {
		"class": "coin",
	});

	coin.attr("data-value", value);
	coin.draggable({
		stack: ".coin",
		containment: "#main",
		snap: $(".stack"),
		snapMode: "inner",
		drag: function(event, ui) {
			$(this).addClass("dragging");
			$(this).addClass("dragged");
			showTopCoinInStacks();
		},
		stop: function(event, ui) {
			$(this).removeClass("dragging");
			refresh();
		}
	});

	return coin;
}

function createStamp(cost) {
	var stamp = $("<div>", {
		"class": "stamp",
	});

	stamp = $("<div class=\"stamp\"><div><div><span>" + cost + "</span></div></div></div>");
	stamp.attr("data-cost", cost);

	return stamp;
}

function State() {
	this.introMessage = "";
	this.validMessage = "";

	this.validationMethod = null;
	this.rejectionMethod = null;

	this.stampPrice = 0;

	this.nextState = null;
}