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

import org.springframework.data.repository.PagingAndSortingRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.repository.query.Param;
/**
 * @author Greg Turnquist
 */
// tag::code[]
public interface HistoricalPricesRepository extends PagingAndSortingRepository<HistoricalPrices, Long> {

  public Page findBysymbolContainingIgnoreCase(@Param("symbol") String symbol, Pageable p);

//  public Page findBysymbolContainingIgnoreCaseOrderBySymbolAsc(@Param("symbol") String symbol, Pageable p);
//  public Page findBysymbolContainingIgnoreCaseOrderBySymbolDesc(@Param("symbol") String symbol, Pageable p);

//  public Page findByitemtextContainingIgnoreCase(@Param("itemtext") String itemtext, Pageable p);

//  public Page findByyearContainingIgnoreCase(@Param("year") String year, Pageable p);

//  public Page findByitemContainingIgnoreCaseOrItemtextContainingIgnoreCaseOrTypeContainingIgnoreCase(@Param("itemtext") String item, @Param("itemtext") String itemtext,  @Param("itemtext") String type,Pageable p);

//  public Page findByitemContainingIgnoreCaseAndItemtextContainingIgnoreCase(@Param("item") String item, @Param("itemtext") String itemtext, Pageable p);

}
// end::code[]
