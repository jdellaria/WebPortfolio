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
import { Pie, Bar } from 'react-chartjs-2';
import {ResponsiveContainer, LineChart,Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,} from 'recharts';

import * as d3 from 'd3-array';

const root = '/api/historicalPriceses/search';


class ChartDisplay extends React.Component {
//class NLUItems extends React.Component {
	constructor(props) {
		super(props);
		this.state = {historicalPriceses: [], cellSelected: [], attributes: [], sortBy: "dateStamp,desc", searchBy:'findBysymbolContainingIgnoreCase', page: 1, symbol: 'adbe', pageSize: 800, sort:"symbol,desc", links: {}};
		this.updatePageSize = this.updatePageSize.bind(this);
		this.onNavigate = this.onNavigate.bind(this);
		this.refreshCurrentPage = this.refreshCurrentPage.bind(this);
		this.refreshAndGoToLastPage = this.refreshAndGoToLastPage.bind(this);

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
			console.log("loadFromServer: this.state.pageSize = " , this.state.pageSize);
			console.log("loadFromServer: this.state.historicalPriceses = ", this.state.historicalPriceses);
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
	                  cellSelected={this.state.cellSelected}/>

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
											cellSelected={this.state.cellSelected}/>

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
				  <div className="modal fade" id="exampleModal" tabIndex="-1" role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true">
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
					<table className="table table-bordered"  width="100%" cellSpacing="0">
						<thead>
							<tr>
							<th>
								<Button outline color="primary" >Symbol <i ></i></Button>{' '}
							</th>
							<th>
								<Button outline color="primary" >Date <i ></i></Button>{' '}
							</th>
							<th>
								<Button outline color="primary" >Open <i ></i></Button>{' '}
							</th>
							<th>
								<Button outline color="primary" >High <i ></i></Button>{' '}
							</th>
							<th>
								<Button outline color="primary" >Low <i ></i></Button>{' '}
							</th>
							<th>
								<Button outline color="primary" >Close <i ></i></Button>{' '}
							</th>
							<th>
								<Button outline color="primary" >adjClose <i ></i></Button>{' '}
							</th>
							<th>
								<Button outline color="primary" >Volume <i ></i></Button>{' '}
							</th>
							<th>
								<Button outline color="primary" >Volume <i ></i></Button>{' '}
							</th>
							<th>
								<Button outline color="primary" >Volume <i></i></Button>{' '}
							</th>
							<th>
								<Button outline color="primary" >Volume <i ></i></Button>{' '}
							</th>
							<th>
								<Button outline color="primary" >Disgust <i ></i></Button>{' '}
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
  var jonData = (props) => {
    let temp = {}
    return  props.historicalPriceses.map(row => {
      temp.name = row.entity.symbol
      temp.close = row.entity.close
      return row
    })
  };

  let jonVar = this.props.historicalPriceses.map(obj =>{
    let rObj = obj.entity
    return rObj
  });
  console.log("webGroupByDate jonVar: " , jonVar);
  let webGroupByDate = d3.group(jonVar, d=>d.dateStamp);
  console.log("webGroupByDate: " , webGroupByDate);

  let jonChartData = {};
  jonChartData = createChartDate(webGroupByDate);
  console.log("jonChartData: " , jonChartData);
  function createChartDate(mapData)
  {
    let rArray = new Array();
    mapData.forEach(function(value, key) {
      rArray.push(extractArrayData(value));
    });
    return rArray;
  }

  function extractArrayData(arrayData)
  {
    let rObj = {};
    arrayData.forEach(element => {
      rObj.date = element.dateStamp;
      rObj[element.symbol] = element.close;
    });
    return rObj;
  }



console.log("ChartDataList this.props.historicalPriceses", this.props.historicalPriceses );
//console.log("ChartDataList this.props.historicalPriceses[0].entity", this.props.historicalPriceses[0].entity );

//console.log("ChartDataList historicalPriceses[0].props",historicalPriceses[0].props );

		return (
            <div>
              <div className="row">
              <ResponsiveContainer  width='100%' aspect={6.0/1.0}>
                <LineChart  data={jonChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5,}}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="SBUX" stroke="black" dot={false} />
                  <Line type="monotone" dataKey="ADBE" stroke="green" dot={false} />
                </LineChart>
              </ResponsiveContainer>
              </div>
            </div>
		)
	}
}

export default ChartDisplay;
