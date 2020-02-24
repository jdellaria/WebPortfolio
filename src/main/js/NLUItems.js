'use strict';


//const React = require('react');
import React from 'react';
//const ReactDOM = require('react-dom');
import ReactDOM from 'react-dom';
//const when = require('when');
import when from 'when';
//const client = require('./client');
import client from './client';
//import { NavBar } from './NavBar';
//const follow = require('./follow'); // function to hop multiple links by "rel"
import follow from './follow';
//const stompClient = require('./websocket-listener');
import stompClient from './websocket-listener';
//const root = '/api';
import { Button , ButtonGroup } from 'reactstrap';
import {Line, Pie, Bar } from 'react-chartjs-2';

const root = '/api/historicalPriceses/search';


class NLUItems extends React.Component {

	constructor(props) {
		super(props);
		this.state = {historicalPriceses: [], cellSelected: [], attributes: [], sortBy: "symbol,desc", searchBy:'findBysymbolContainingIgnoreCase', page: 1, symbol: 'adbe', pageSize: 8, sort:"symbol,desc", links: {}};
		this.updatePageSize = this.updatePageSize.bind(this);
		this.onNavigate = this.onNavigate.bind(this);
		this.refreshCurrentPage = this.refreshCurrentPage.bind(this);
		this.refreshAndGoToLastPage = this.refreshAndGoToLastPage.bind(this);
		this.onDataCellClick = this.onDataCellClick.bind(this);
		this.onDataCellClickCarat = this.onDataCellClickCarat.bind(this);
	}

	onDataCellClick(selected) {
		var mySortBy = 'year,desc';
    const index = this.state.cellSelected.indexOf(selected);
    if (index < 0) {
						if (selected == 6){ //year
							mySortBy = 'close,asc';
							}
						if (selected == 5){ //count
							mySortBy = 'low,asc';
						}
						if (selected ==4){ //relevance
							mySortBy = 'high,asc';
						}
						if (selected == 3){ //type
							mySortBy = 'open,asc';
						}
						if (selected == 2){ //itemtext
							mySortBy = 'dateStamp,asc';
						}
						if (selected == 1){ //item
							mySortBy = 'symbol,asc';
						}

						if (selected == 7){ //item
							mySortBy = 'adjClose,asc';
						}
						if (selected == 8){ //item
							mySortBy = 'volume,asc';
						}
						if (selected == 9){ //item
							mySortBy = 'volume,asc';
						}
						if (selected == 10){ //item
							mySortBy = 'volume,asc';
						}
						if (selected == 11){ //item
							mySortBy = 'volume,asc';
						}
						if (selected == 12){ //item
							mySortBy = 'volume,asc';
						}

			this.state.cellSelected.push(selected);
    } else {

				if (selected == 6){ //year
					mySortBy = 'close,desc';
					}
				if (selected == 5){ //count
					mySortBy = 'low,desc';
				}
				if (selected ==4){ //relevance
					mySortBy = 'high,desc';
				}
				if (selected == 3){ //type
					mySortBy = 'open,desc';
				}
				if (selected == 2){ //itemtext
					mySortBy = 'dateStamp,desc';
				}
				if (selected == 1){ //item
					mySortBy = 'symbol,desc';
				}

				if (selected == 7){ //item
					mySortBy = 'adjClose,desc';
				}
				if (selected == 8){ //item
					mySortBy = 'volume,desc';
				}
				if (selected == 9){ //item
					mySortBy = 'volume,desc';
				}
				if (selected == 10){ //item
					mySortBy = 'volume,desc';
				}
				if (selected == 11){ //item
					mySortBy = 'volume,desc';
				}
				if (selected == 12){ //item
					mySortBy = 'volume,desc';
				}
      this.state.cellSelected.splice(index, 1);
    }
    this.setState({ cellSelected: [...this.state.cellSelected] });
		this.setState({ sortBy: mySortBy });
		this.loadFromServer(this.state.itemtext, this.state.pageSize, mySortBy);
  }

  onDataCellClickCarat(selected) {
    const index = this.state.cellSelected.indexOf(selected);
    if (index < 0) {
      return( "fa fa-caret-down") ;
    } else {
      return( "fa fa-caret-up") ;
    }
  }

	loadFromServer(itemTextUpdate, pageSize, pageSortUpdate) {
//this.state.item = this.props.itemParameter

		follow(client, root, [
				{rel: this.state.searchBy, params: {size: pageSize, sort:pageSortUpdate, item:this.props.itemParameter, symbol: itemTextUpdate}}] //itemText}}]
		).then(nluCollection => {
				return client({
					method: 'GET',
					path: "api/profile/historicalPriceses",
					headers: {'Accept': 'application/schema+json'}
				}).then(schema => {
					this.schema = schema.entity;
					this.links = nluCollection.entity._links;
					return nluCollection;
				});
		}).then(nluCollection => {
			this.page = nluCollection.entity.page;
			return nluCollection.entity._embedded.historicalPriceses.map(nlu =>
					client({
						method: 'GET',
						path: nlu._links.self.href
					})
			);
		}).then(nluPromises => {
			return when.all(nluPromises);
		}).done(historicalPriceses => {
			this.setState({
				page: this.page,
				historicalPriceses: historicalPriceses,
				attributes: Object.keys(this.schema.properties),
				pageSize: pageSize,
				sort: pageSortUpdate,
				symbol: itemTextUpdate,
				links: this.links
			});
			console.log("props.historicalPriceses[0].entity.symbol = " + this.props.historicalPriceses[0].entity.symbol);
		});
	}

	onNavigate(navUri) {
		client({
			method: 'GET',
			path: navUri
		}).then(nluCollection => {
			this.links = nluCollection.entity._links;
			this.page = nluCollection.entity.page;

			return nluCollection.entity._embedded.historicalPriceses.map(nlu =>
					client({
						method: 'GET',
						path: nlu._links.self.href
					})
			);
		}).then(nluPromises => {
			return when.all(nluPromises);
		}).done(historicalPriceses => {
			this.setState({
				page: this.page,
				historicalPriceses: historicalPriceses,
				attributes: Object.keys(this.schema.properties),
				pageSize: this.state.pageSize,
				itemTextInput: this.state.itemTextInput,
				links: this.links
			});
		});
	}

	updatePageSize(itemTextUpdate, pageSizeUpdate, pageSortUpdate, searchByUpdate) {
			this.loadFromServer(itemTextUpdate, pageSizeUpdate, pageSortUpdate);
	}
	// tag::websocket-handlers[]
	refreshAndGoToLastPage(message) {
		follow(client, root, [{
			rel: 'historicalPriceses',
			params: {size: this.state.pageSize, symbol: this.state.itemTextInput}
		}]).done(response => {
			if (response.entity._links.last !== undefined) {
				this.onNavigate(response.entity._links.last.href);
			} else {
				this.onNavigate(response.entity._links.self.href);
			}
		})
	}

	refreshCurrentPage(message) {
		follow(client, root, [{
			rel: 'historicalPriceses',
			params: {
				size: this.state.pageSize,
				symbol: this.state.itemTextInput,
				page: this.state.page.number
			}
		}]).then(nluCollection => {
			this.links = nluCollection.entity._links;
			this.page = nluCollection.entity.page;

			return nluCollection.entity._embedded.historicalPriceses.map(nlu => {
				return client({
					method: 'GET',
					path: nlu._links.self.href
				})
			});
		}).then(nluPromises => {
			return when.all(nluPromises);
		}).then(historicalPriceses => {
			this.setState({
				page: this.page,
				historicalPriceses: historicalPriceses,
				attributes: Object.keys(this.schema.properties),
				pageSize: this.state.pageSize,
				symbol: this.state.itemTextInput,
				links: this.links
			});

		});
	}

	// end::websocket-handlers[]
	// tag::register-handlers[]
	componentDidMount() {
		this.loadFromServer(this.state.itemTextInput, this.state.pageSize, this.state.sortBy);
		stompClient.register([
			{route: '/topic/newNlu', callback: this.refreshAndGoToLastPage},
			{route: '/topic/updateNlu', callback: this.refreshCurrentPage},
			{route: '/topic/deleteNlu', callback: this.refreshCurrentPage}
		]);
	}
	// end::register-handlers[]
	//	<p>Cells Selected: {JSON.stringify(this.state.cellSelected)}</p>
	render() {
		return (
		<div className="content-wrapper">
      <div className="container-fluid">
				<div className="card mb-3">
					<div className="card-header">
						<i className="fa fa-bar-chart"></i>Charts - {this.props.itemParameter}</div>
					<div className="card-body">
	          <ChartDataList page={this.state.page}
	                  historicalPriceses={this.state.historicalPriceses}
	                  links={this.state.links}
	                  pageSize={this.state.pageSize}
	                  sortBy={this.state.sortBy}
	                  searchBy={this.state.searchBy}
	                  itemTextInput={this.state.itemTextInput}
	                  attributes={this.state.attributes}
	                  onNavigate={this.onNavigate}
	                  onUpdate={this.onUpdate}
	                  onDelete={this.onDelete}
	                  updatePageSize={this.updatePageSize}
	                  cellSelected={this.state.cellSelected}
	                  onDataCellClick={this.onDataCellClick}
	                  onDataCellClickCarat={this.onDataCellClickCarat}/>
					</div>
					<div className="card-footer small text-muted">{this.props.itemParameter} Updated yesterday at 11:59 PM</div>
				</div>
				<div className="card mb-3">
						<div className="card-header">
							<i className="fa fa-table"></i> Entity Data
						</div>
						<div className="container">
						</div>
						<div className="card-body">
							<NluList page={this.state.page}
										  historicalPriceses={this.state.historicalPriceses}
										  links={this.state.links}
										  pageSize={this.state.pageSize}
											sortBy={this.state.sortBy}
											searchBy={this.state.searchBy}
											itemTextInput={this.state.itemTextInput}
										  attributes={this.state.attributes}
										  onNavigate={this.onNavigate}
										  onUpdate={this.onUpdate}
										  onDelete={this.onDelete}
										  updatePageSize={this.updatePageSize}
											cellSelected={this.state.cellSelected}
											onDataCellClick={this.onDataCellClick}
											onDataCellClickCarat={this.onDataCellClickCarat}/>
							</div>
						<div className="card-footer small text-muted">Updated yesterday at 11:59 PM
						</div>
				</div>
				  <footer className="sticky-footer">
				  	<div className="container">
				  		<div className="text-center">
				  			<small>Copyright © Your Website 2017</small>
				  		</div>
				  	</div>
				  </footer>
					<a className="scroll-to-top rounded" href="#page-top">
						<i className="fa fa-angle-up"></i>
					</a>
				  <div className="modal fade" id="exampleModal" tabindex="-1" role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true">
				    <div className="modal-dialog" role="document">
				      <div className="modal-content">
				        <div className="modal-header">
				          <h5 className="modal-title" id="exampleModalLabel">Ready to Leave?</h5>
				          <button className="close" type="button" data-dismiss="modal" aria-label="Close">
				            <span aria-hidden="true">×</span>
				          </button>
				        </div>
				        <div className="modal-body">Select "Logout" below if you are ready to end your current session.</div>
				        <div className="modal-footer">
				          <button className="btn btn-secondary" type="button" data-dismiss="modal">Cancel</button>
				          <a className="btn btn-primary" href="login.html">Logout</a>
				        </div>
				      </div>
				    </div>
				  </div>
			</div>
		</div>
		)
	}
}

class NluList extends React.Component {

	constructor(props) {
		super(props);
		this.handleNavFirst = this.handleNavFirst.bind(this);
		this.handleNavPrev = this.handleNavPrev.bind(this);
		this.handleNavNext = this.handleNavNext.bind(this);
		this.handleNavLast = this.handleNavLast.bind(this);
		this.handleInput = this.handleInput.bind(this);
	}

	handleInput(e) {
		e.preventDefault();
		var pageSize = ReactDOM.findDOMNode(this.refs.pageSize).value;
		var itemTextInput = ReactDOM.findDOMNode(this.refs.itemTextInput).value;
		if (/^[0-9]+$/.test(pageSize)) {
			this.props.updatePageSize(itemTextInput, pageSize, this.props.sortBy, this.props.searchBy);
		} else {
			ReactDOM.fin
			dDOMNode(this.refs.pageSize).value = pageSize.substring(0, pageSize.length - 1);
		}
	}

	handleNavFirst(e) {
		e.preventDefault();
		this.props.onNavigate(this.props.links.first.href);
	}

	handleNavPrev(e) {
		e.preventDefault();
		this.props.onNavigate(this.props.links.prev.href);
	}

	handleNavNext(e) {
		e.preventDefault();
		this.props.onNavigate(this.props.links.next.href);
	}

	handleNavLast(e) {
		e.preventDefault();
		this.props.onNavigate(this.props.links.last.href);
	}

	render() {
		var pageInfo = this.props.page.hasOwnProperty("number") ?
			<div>Page {this.props.page.number + 1} of {this.props.page.totalPages}</div> : null;
		var historicalPriceses = this.props.historicalPriceses.map(nlu =>
			<Nlu key={nlu.entity._links.self.href}
					  nlu={nlu}
					  attributes={this.props.attributes}
					  onUpdate={this.props.onUpdate}
					  onDelete={this.props.onDelete}/>
		);

		var navLinks = [];
//		if ("first" in this.props.links) {
			navLinks.push(<button key="first" onClick={this.handleNavFirst}>&lt;&lt;</button>);
//		}
//		if ("prev" in this.props.links) {
			navLinks.push(<button key="prev" onClick={this.handleNavPrev}>&lt;</button>);
//		}
//		if ("next" in this.props.links) {
			navLinks.push(<button key="next" onClick={this.handleNavNext}>&gt;</button>);
//		}
//		if ("last" in this.props.links) {
			navLinks.push(<button key="last" onClick={this.handleNavLast}>&gt;&gt;</button>);
//		}

		return (
			<div className="table-responsive">
					{pageInfo}
					{navLinks}
					Data Set Size	<input ref="pageSize" defaultValue={this.props.pageSize} onInput={this.handleInput}/>
					Search <input ref="itemTextInput" defaultValue={this.props.itemTextInput} onInput={this.handleInput}/>
					<table className="table table-bordered"  width="100%" cellspacing="0">
						<thead>
							<tr>
							<th>
								<Button outline color="primary" onClick={() => this.props.onDataCellClick(1)}>Symbol <i className={this.props.onDataCellClickCarat(1)}></i></Button>{' '}
							</th>
							<th>
								<Button outline color="primary" onClick={() => this.props.onDataCellClick(2)}>Date <i className={this.props.onDataCellClickCarat(2)}></i></Button>{' '}
							</th>
							<th>
								<Button outline color="primary" onClick={() => this.props.onDataCellClick(3)}>Open <i className={this.props.onDataCellClickCarat(3)}></i></Button>{' '}
							</th>
							<th>
								<Button outline color="primary" onClick={() => this.props.onDataCellClick(4)}>High <i className={this.props.onDataCellClickCarat(4)}></i></Button>{' '}
							</th>
							<th>
								<Button outline color="primary" onClick={() => this.props.onDataCellClick(5)}>Low <i className={this.props.onDataCellClickCarat(5)}></i></Button>{' '}
							</th>
							<th>
								<Button outline color="primary" onClick={() => this.props.onDataCellClick(6)}>Close <i className={this.props.onDataCellClickCarat(6)}></i></Button>{' '}
							</th>
							<th>
								<Button outline color="primary" onClick={() => this.props.onDataCellClick(7)}>adjClose <i className={this.props.onDataCellClickCarat(6)}></i></Button>{' '}
							</th>
							<th>
								<Button outline color="primary" onClick={() => this.props.onDataCellClick(8)}>Volume <i className={this.props.onDataCellClickCarat(6)}></i></Button>{' '}
							</th>
							<th>
								<Button outline color="primary" onClick={() => this.props.onDataCellClick(9)}>Volume <i className={this.props.onDataCellClickCarat(6)}></i></Button>{' '}
							</th>
							<th>
								<Button outline color="primary" onClick={() => this.props.onDataCellClick(10)}>Volume <i className={this.props.onDataCellClickCarat(6)}></i></Button>{' '}
							</th>
							<th>
								<Button outline color="primary" onClick={() => this.props.onDataCellClick(11)}>Volume <i className={this.props.onDataCellClickCarat(6)}></i></Button>{' '}
							</th>
							<th>
								<Button outline color="primary" onClick={() => this.props.onDataCellClick(12)}>Disgust <i className={this.props.onDataCellClickCarat(6)}></i></Button>{' '}
							</th>
							</tr>
						</thead>
						<tfoot>
							<tr>
  							<th>Symbol</th>
  							<th>Date</th>
  							<th>Open</th>
  							<th>High</th>
  							<th>Low</th>
  							<th>Close</th>
								<th>Adj Close</th>
								<th>Volume</th>
								<th>Volume</th>
								<th>Volume</th>
								<th>Volume</th>
								<th>Volume</th>
							</tr>
						</tfoot>
						<tbody>
							{historicalPriceses}
						</tbody>
					</table>
				<div>
					{navLinks}
				</div>
			</div>
		)
	}
}

class Nlu extends React.Component {

	constructor(props) {
		super(props);
		this.handleDelete = this.handleDelete.bind(this);
		this.handleUpdate = this.handleUpdate.bind(this);
	}
	handleDelete() {
		this.props.onDelete(this.props.nlu);
	}
	handleUpdate() {
		this.props.onUpdate(this.props.nlu);
	}
	render() {
		return (
			<tr>
				<td>{this.props.nlu.entity.symbol}</td>
				<td>{this.props.nlu.entity.dateStamp}</td>
				<td>{this.props.nlu.entity.open}</td>
				<td>{this.props.nlu.entity.high}</td>
				<td>{this.props.nlu.entity.low}</td>
				<td>{this.props.nlu.entity.close}</td>
				<td>{this.props.nlu.entity.adjClose}</td>
				<td>{this.props.nlu.entity.volume}</td>
				<td>{this.props.nlu.entity.volume}</td>
				<td>{this.props.nlu.entity.volume}</td>
				<td>{this.props.nlu.entity.volume}</td>
				<td>{this.props.nlu.entity.volume}</td>
			</tr>
		)
	}
}

class ChartDataList extends React.Component {

	constructor(props) {
		super(props);
	}
	render() {
    var myBarChart = {
        labels: [],
        datasets: [{ label: "Count by ItemText", backgroundColor: "rgba(2,117,216,1)", borderColor: "rgba(2,117,216,1)", data: [],  backgroundColor: ['#007fff', '#dc3545', '#ffc107', '#28a745', '#800080', '#FF00FF','#0000FF','#00FFFF','#00FF00',' 	#FFFF00','#FF0000',' 	#000000',' 	#808080','#C0C0C0','#77777777','#55555555','#aaaaaaaa','#6b89af','#ff7a30','#809030'], }]
      };
      var myBarChartOptions = {
        options: {
          scales: {
            xAxes: [{
              time: {
                unit: 'month'
              },
              gridLines: {
                display: false
              },
              ticks: {
                maxTicksLimit: 100
              }
            }],
            yAxes: [{
              ticks: {
                min: 0,
                max: 15000,
                maxTicksLimit: 100
              },
              gridLines: {
                display: true
              }
            }],
          },
          legend: {
            display: false
          }
        }
      };
      var myYearAreaChart = {
        labels: [],
        datasets: [{
          label: "Count by Year",
          lineTension: 0.3,
          backgroundColor: "rgba(2,117,216,0.2)",
          borderColor: "rgba(2,117,216,1)",
          pointRadius: 5,
          pointBackgroundColor: "rgba(2,117,216,1)",
          pointBorderColor: "rgba(255,255,255,0.8)",
          pointHoverRadius: 5,
          pointHoverBackgroundColor: "rgba(2,117,216,1)",
          pointHitRadius: 20,
          pointBorderWidth: 2,
          data: [],
        }
      ]
      };
      var myYearAreaChartOptions = {
        options: {
          scales: {
            xAxes: [{
              time: {
                unit: 'date'
              },
              gridLines: {
                display: false
              },
              ticks: {
                maxTicksLimit: 100
              }
            }],
            yAxes: [{
              ticks: {
                min: 0,
                max: 40000,
                maxTicksLimit: 100
              },
              gridLines: {
                color: "rgba(0, 0, 0, .125)",
              }
            }],
          },
          legend: {
            display: false
          }
        }
      };
		var historicalPriceses = this.props.historicalPriceses.map(nlu =>
			<ChartData key={nlu.entity._links.self.href}
					  nlu={nlu}
					  attributes={this.props.attributes}
            barChart={myBarChart}
            lineChart={myYearAreaChart}
            />
		);
		return (
            <div>
							{historicalPriceses}

              <div className="row">
                <div className="col-sm-6 my-auto">
                  <Bar data={myBarChart} width={100} height={50} options={myBarChartOptions} />
                </div>
                <div className="col-sm-6 my-auto">
                  <Line data={myYearAreaChart} width={100} height={50} options={myYearAreaChartOptions}/>
                </div>
              </div>
            </div>
		)
	}
}

class ChartData extends React.Component {

	constructor(props) {
		super(props);
	}

	render() {
    this.props.barChart.labels.push(this.props.nlu.entity.symbol);
    this.props.barChart.datasets[0].data.push(this.props.nlu.entity.count);
    this.props.lineChart.labels.push(this.props.nlu.entity.year);
    this.props.lineChart.datasets[0].data.push(this.props.nlu.entity.count);
		return (
      <div>
      </div>
  	);
	}
}

export default NLUItems;
