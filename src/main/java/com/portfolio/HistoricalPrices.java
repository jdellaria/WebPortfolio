/*
 * Copyright 2015 the original author or authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.portfolio;

import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.Id;
import javax.persistence.Version;
import javax.persistence.Table;
import java.util.Date;

import lombok.Data;

import com.fasterxml.jackson.annotation.JsonIgnore;

/**
 * @author Greg Turnquist
 */
// tag::code[]
@Data
@Entity
@Table(name = "HistoricalPrices")
public class HistoricalPrices {

	private @Id @GeneratedValue Long id;
	private String symbol;
	//private String stringTimeStamp;
	private Date dateStamp;
	private Double open;
	private Double high;
	private Double low;
	private Double close;
	private Double adjClose;
	private Integer volume;

//	private @Version @JsonIgnore Long version;

	private HistoricalPrices() {}


	public HistoricalPrices(String symbol, Date dateStamp, Double open, Double high, Double low, Double close, Double adjClose, Integer volume) {
		this.symbol = symbol;
	//	this.stringTimeStamp = timeStamp;
		this.dateStamp = dateStamp;
		this.open = open;
		this.high = high;
		this.low = low;
		this.close = close;
		this.adjClose = adjClose;
		this.volume = volume;

	}
}
// end::code[]
