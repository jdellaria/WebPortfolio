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
//import stompClient from './websocket-listener';
//const root = '/api';
import { Button , ButtonGroup } from 'reactstrap';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, BarChart, Bar, Cell, ReferenceLine,
} from 'recharts';
import * as d3 from 'd3-array';

const root = '/api/historicalValues/search';
const data01 = [
  { name: 'Group A', value: 400 }, { name: 'Group B', value: 300 },
  { name: 'Group C', value: 300 }, { name: 'Group D', value: 200 },
  { name: 'Group E', value: 278 }, { name: 'Group F', value: 189 },
];
const data02 = [
  { name: 'Group A', value: 2400 }, { name: 'Group B', value: 4567 },
  { name: 'Group C', value: 1398 }, { name: 'Group D', value: 9800 },
  { name: 'Group E', value: 3908 }, { name: 'Group F', value: 4800 },
];


class ChartDisplay extends React.Component {
//class NLUItems extends React.Component {
	constructor(props) {
		super(props);
		this.state = {historicalValues: [], cellSelected: [], attributes: [], sortBy: "dateStamp,desc", searchBy:'findBysymbolContainingIgnoreCase', page: 1, symbol: 'adbe', pageSize: 800, sort:"symbol,desc", links: {}};
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
					path: "api/profile/historicalValues",
					headers: {'Accept': 'application/schema+json'}
				}).then(schema => {
					this.schema = schema.entity;
					this.links = nluCollection.entity._links;
					return nluCollection;
				});
		}).then(nluCollection => {
			this.page = nluCollection.entity.page;
			return nluCollection.entity._embedded.historicalValues.map(nlu =>
					client({
						method: 'GET',
						path: nlu._links.self.href
					})
			);
		}).then(nluPromises => {
			return when.all(nluPromises);
		}).done(historicalValues => {
			this.setState({
				page: this.page,
				historicalValues: historicalValues,
				attributes: Object.keys(this.schema.properties),
				pageSize: pageSize,
				sort: pageSortUpdate,
				symbol: itemTextUpdate,
				links: this.links
			});
			console.log("loadFromServer: this.state.pageSize = " , this.state.pageSize);
			console.log("loadFromServer: this.state.historicalValues = ", this.state.historicalValues);
		});
	}

	onNavigate(navUri) {
		client({
			method: 'GET',
			path: navUri
		}).then(nluCollection => {
			this.links = nluCollection.entity._links;
			this.page = nluCollection.entity.page;

			return nluCollection.entity._embedded.historicalValues.map(nlu =>
					client({
						method: 'GET',
						path: nlu._links.self.href
					})
			);
		}).then(nluPromises => {
			return when.all(nluPromises);
		}).done(historicalValues => {
			this.setState({
				page: this.page,
				historicalValues: historicalValues,
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
			rel: 'historicalValues',
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
			rel: 'historicalValues',
			params: {
				size: this.state.pageSize,
				symbol: this.state.itemTextInput,
				page: this.state.page.number
			}
		}]).then(nluCollection => {
			this.links = nluCollection.entity._links;
			this.page = nluCollection.entity.page;

			return nluCollection.entity._embedded.historicalValues.map(nlu => {
				return client({
					method: 'GET',
					path: nlu._links.self.href
				})
			});
		}).then(nluPromises => {
			return when.all(nluPromises);
		}).then(historicalValues => {
			this.setState({
				page: this.page,
				historicalValues: historicalValues,
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
//		stompClient.register([
//			{route: '/topic/newNlu', callback: this.refreshAndGoToLastPage},
//			{route: '/topic/updateNlu', callback: this.refreshCurrentPage},
//			{route: '/topic/deleteNlu', callback: this.refreshCurrentPage}
//		]);
	}
	// end::register-handlers[]
	//	<p>Cells Selected: {JSON.stringify(this.state.cellSelected)}</p>
	render() {
		return (
		<div className="content-wrapper">
			<div className="card mb-3">
				<div className="card-header">
					<i className="fa fa-bar-chart"></i>Valuation - {this.props.itemParameter}
        </div>
				<div className="card-body">
          <ChartHistoricalValueList page={this.state.page}
                  historicalValues={this.state.historicalValues}
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
			<div className="card-body">
        <div className="row">
          <div className="col-lg-8">
            <div className="card mb-3">
              <div className="card-header"><i className="fa fa-bar-chart"></i>Top Keywords </div>
              <div className="card-body">
                <ChartDataList page={this.state.page}
    	                  historicalValues={this.state.historicalValues}
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
              <div className="card-footer small text-muted">Updated yesterday at 11:59 PM</div>
            </div>
            <hr className="mt-2"/>
          </div>

          <div className="col-lg-4">
            <div className="card mb-3">
              <div className="card-header">
                <i className="fa fa-pie-chart"></i> Pie Chart Example
              </div>
              <div className="card-body">
                <ResponsiveContainer  width='100%' aspect={5.0/5.0}>
                  <PieChart>
                    <Pie data={data01} dataKey="value" cx={200} cy={200} outerRadius={60} fill="#8884d8" />
                    <Pie data={data02} dataKey="value" cx={200} cy={200} innerRadius={70} outerRadius={90} fill="#82ca9d" label />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="card-footer small text-muted">Updated yesterday at 11:59 PM</div>
            </div>
          </div>
        </div>
      </div>
		  <footer className="sticky-footer">
		  	<div className="container">
		  		<div className="text-center">
		  			<small>Copyright © Jon Dellaria 2020</small>
		  		</div>
		  	</div>
		  </footer>
			<a className="scroll-to-top rounded" href="#page-top">
				<i className="fa fa-angle-up"></i>
			</a>
		</div>
		)
	}
}


class ChartHistoricalValueList extends React.Component {

	constructor(props) {
		super(props);
	}

	render() {
  var jonData = (props) => {
    let temp = {}
    return  props.historicalValues.map(row => {
      temp.name = row.entity.symbol
      temp.close = row.entity.close
      return row
    })
  };

  let jonVar = this.props.historicalValues.map(obj =>{
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
    rArray.reverse();
    return rArray;
  }

  function extractArrayData(arrayData)
  {
    let rObj = {};
    rObj.value = 0;
    arrayData.forEach(element => {
      rObj.date = element.dateStamp;
//      rObj[element.symbol] = element.close;
      rObj.value = rObj.value + element.valuation;
    });
    return rObj;
  }

  console.log("ChartDataList this.props.historicalValues", this.props.historicalValues );
//console.log("ChartDataList this.props.historicalValues[0].entity", this.props.historicalValues[0].entity );
//console.log("ChartDataList historicalValues[0].props",historicalValues[0].props );
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
              <Line type="monotone" dataKey="value" stroke="black" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
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
    return  props.historicalValues.map(row => {
      temp.name = row.entity.symbol
      temp.close = row.entity.close
      return row
    })
  };

  let jonVar = this.props.historicalValues.map(obj =>{
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
    rArray.reverse();
    return rArray;
  }

  function extractArrayData(arrayData)
  {
    let rObj = {};
    arrayData.forEach(element => {
      rObj.date = element.dateStamp;
      rObj[element.symbol] = element.valuation;
    });
    return rObj;
  }

  console.log("ChartDataList this.props.historicalValues", this.props.historicalValues );
//console.log("ChartDataList this.props.historicalValues[0].entity", this.props.historicalValues[0].entity );
//console.log("ChartDataList historicalValues[0].props",historicalValues[0].props );
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
