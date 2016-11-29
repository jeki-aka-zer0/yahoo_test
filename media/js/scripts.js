/**
 * Main script
 * https://javascriptobfuscator.com/Javascript-Obfuscator.aspx
 *
 * @author zer0 <zer0.stat@mail.ru>
 * @link https://github.com/jeki-aka-zer0
 * @date 29.11.16
 */

+function($, window, document, undefined){

	var
		defaults = {
			selectors: {
				formAdd: '.js-form-add-flot',
				wrap: '.js-flots-wrap',
				example: '.js-flot-example',
				code: '#code',
				flot: '.js-flot',
				period: '.js-period',
				spin: '.js-flot-spin'
			},
			dailyKeys: ['Open', 'Low', 'High', 'Close']
		},
		MyApi = {

			/**
			 * init app
			 */
			init: function(){

				MyApi.$wrap = $(defaults.selectors.wrap);
				MyApi.$example = MyApi.$wrap.find(defaults.selectors.example);
				MyApi.$code = $(defaults.selectors.code);

				$(document)
					.on('submit', defaults.selectors.formAdd, MyApi.show)
					.on('change', defaults.selectors.period, MyApi.changePeriod)
			},

			/**
			 * show block with flot
			 * @param e
			 * @returns {boolean}
			 */
			show: function(e){
				var
					code = MyApi.$code.val(),
					className = 'flot-' + code;

				if (!$('.' + className).length) {
					var
						$flot = MyApi.$example.clone(),
						$periods = $flot.find(defaults.selectors.period),
						$firstPeriod = $periods.eq(0),
						period = $firstPeriod.val();

					$flot
						.removeClass('hidden').addClass(className)
						.appendTo(MyApi.$wrap);

					$firstPeriod.prop('checked', 'checked');

					$periods.each(function(){
						var
							$input = $(this),
							id = $input.attr('id'),
							name = $input.attr('name'),
							$label = $input.siblings('label[for=' + id + "]"),
							newId = id + '-' + code,
							newName = name + '-' + code;

						$input.attr({id: newId, name: newName}).data('code', code);
						$label.attr('for', newId);
					});

					MyApi._render(code, period)
				}

				e.preventDefault();
				return false;
			},

			/**
			 * render flot
			 * @param code
			 * @param period
			 * @private
			 */
			_render: function(code, period){

				var
					className = 'flot-' + code,
					data = [],
					codeLabel = MyApi.$code.find('option[value=' + code + ']').text(),
					options,
					$spin = $('.' + className + ' ' + defaults.selectors.spin);

				$spin.removeClass('hidden');

				$.getJSON(MyApi._getUrl(code, period))
					.done(function(response){
						switch (period) {
							case 'day':
								var min, max, diff;

								$.each(defaults.dailyKeys, function(i, key){
									var
										value = parseFloat(response.query.results.quote[key]);

									if (min == undefined)
										min = value;

									if (max == undefined)
										max = value;

									min = Math.min(min, value);
									max = Math.max(max, value);

									data.push([
										key,
										parseFloat(response.query.results.quote[key])
									]);
								});

								diff = max - min;

								options = {
									yaxis: {
										min: Math.floor(min) - diff,
										max: Math.ceil(max) + diff
									},
									xaxis: {
										mode: 'categories',
										tickLength: 5
									},
									lines: {
										show: false
									},
									series: {
										bars: {
											show: true,
											barWidth: 0.6,
											align: 'center'
										}
									}
								};

								break;
							default:
								if (response.query.results.quote != undefined)
									$.each(response.query.results.quote, function(i, item){
										data.push([Date.parse(item.Date), item.Close]);
									});

								options = {
									xaxis: {
										mode: 'time',
										tickLength: 5
									},
									selection: {
										mode: 'x'
									},
									grid: {
										markings: MyApi.weekendAreas
									}
								};
								break;
						}

						$.plot('.' + className + ' ' + defaults.selectors.flot, [{data: data, label: codeLabel}], options);
					})
					.always(function(){
						$spin.addClass('hidden');
					});
			},

			/**
			 * change period
			 * @param e
			 */
			changePeriod: function(e){
				var
					$period = $(e.target),
					period = $period.val(),
					code = $period.data('code');

				MyApi._render(code, period)
			},

			/**
			 * get api url
			 * @param code
			 * @param period
			 * @returns {string}
			 * @private
			 */
			_getUrl: function(code, period){

				// debug file version
				//return '/media/debug/yahoo-' + code + '-' + period + '-history.json';

				var
					day = 60 * 60 * 24 * 1000,
					now = new Date('2016-11-21'),
					dayNumber = now.getDay(),
					date = now.getDate(),
					dateFrom,
					dateTo;

				switch (period) {
					case 'day':
						// get last working day
						// friday if now monday
						if (dayNumber == 1)
							dateFrom = dateTo = new Date(now - 3 * day);
						// friday if now sunday
						else if (dayNumber == 0)
							dateFrom = dateTo = new Date(now - 2 * day);
						else
						// previous day in case the bids have not yet closed
							dateFrom = dateTo = new Date(now - day);
						break;
					case 'month':
						dateFrom = new Date(now - (date - 1) * day);
						dateTo = now;
						break;
					case 'year':
						dateFrom = new Date(now - 365 * day);
						dateTo = now;
						break;
				}

				return 'https://query.yahooapis.com/v1/public/yql?q=select Symbol, Date, Open, Low, High, Close from yahoo.finance.historicaldata where symbol = "' +
					code +
					'" and startDate = "' +
					dateFrom.toISOString().slice(0, 10) +
					'" and endDate = "' +
					dateTo.toISOString().slice(0, 10) +
					'"&format=json&env=store://datatables.org/alltableswithkeys';
			},

			weekendAreas: function(axes){

				var markings = [],
					d = new Date(axes.xaxis.min);

				// go to the first Saturday

				d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 1) % 7))
				d.setUTCSeconds(0);
				d.setUTCMinutes(0);
				d.setUTCHours(0);

				var i = d.getTime();

				// when we don't set yaxis, the rectangle automatically
				// extends to infinity upwards and downwards

				do {
					markings.push({xaxis: {from: i, to: i + 2 * 24 * 60 * 60 * 1000}});
					i += 7 * 24 * 60 * 60 * 1000;
				} while (i < axes.xaxis.max);

				return markings;
			}
		};

	$(document).ready(function(){
		MyApi.init();
	});

}(jQuery, window, document);