import React from "react";
import * as d3 from "d3";
import housingData from "../../data/hud_de_combined.csv";
import { ChartHeader, ChartFooter, ChartContainer } from "./availableUnits";

export default class OccupiedPercentage extends React.Component {
    componentDidMount = () => {
        this.drawOccupiedPercentage();
    }

    componentDidUpdate = () => {
        d3.select("svg").remove();
        this.drawOccupiedPercentage();
    }

    drawOccupiedPercentage = () => {
        //set svg size
        let w = 1000;
        let h = 500;
        let padding = 120;

        let dataset = [], delawareDataset = [], xScale, yScale, xAxis, yAxis, line, delawareLine;
        //loading data from csv file
        d3.csv(housingData).then(data => {
            for (let obj of data) {
                if (obj.code !== "10003003002") continue;
                dataset.push([obj.year, obj.pct_occupied / 100, obj.total_units]);
            } 

            let yearGroup = {};

            for (let obj of data) {
                if (obj.pct_occupied === "" || obj.number_reported === "") continue;
                let year = obj.year;
                if (yearGroup[year]) {
                    yearGroup[year].push([obj.pct_occupied, obj.number_reported])
                } else {
                    yearGroup[year] = [[obj.pct_occupied, obj.number_reported]];
                }
            }

            for (let key in yearGroup) {
                let percentageSum = 0;
                let unitSum = 0;
                for (let [p, u] of yearGroup[key]) {
                    percentageSum += +p;
                    unitSum += +u;
                }
                let percentageAverage = (percentageSum / yearGroup[key].length /100).toFixed(3);
                delawareDataset.push([key, percentageAverage, unitSum]);
            }

            //construct a band scale with specified domain and range
            xScale = d3.scaleBand()
                        .domain(dataset.map(d => d[0]))
                        .range([padding, w - padding])
                        .paddingInner(1);
                                
            //construct a continuous scale with specified domain and range
            yScale = d3.scaleLinear()
                        .domain([0.75, 1])
                        .range([h - padding, padding]);

            //construct a bootom-oriented axis generator for the given scale
            xAxis = d3.axisBottom()
                        .scale(xScale)

            //construct a left-oriented axis generator for the given scale
            yAxis = d3.axisLeft()
                        .scale(yScale)
                        .ticks(5)
                        .tickFormat(d3.format(".0%"))

            line = d3.line()  
                        .x(d => xScale(d[0])) 
                        .y(d => yScale(d[1])); 

            delawareLine = d3.line()
                                .x(d => xScale(d[0])) 
                                .y(d => yScale(d[1]));

            //create svg element
            let svg = d3.select(this.props.occupiedPercentageRef.current)
                        .append("svg")
                        .attr("width", w)
                        .attr("height", h); 

            
            //create lines
            let path = svg.append("path")
                            .datum(dataset) 
                            .attr("class", "line")
                            .attr("d", line); 

            let delawarePath = svg.append("path")
                                    .datum(delawareDataset)
                                    .attr("class", "delawareLine")
                                    .attr("d", delawareLine);
            //create dots
            let circle = svg.append("g")
                            .selectAll("circle")
                            .data(dataset)
                            .enter()
                            .append("circle")
                                .attr("cx", d => xScale(d[0]))
                                .attr("cy", d => yScale(d[1]))
                                .attr("r", 5)
                                .attr("fill", "#a8ddb5")

            let delawareCircle = svg.append("g")
                                    .selectAll("circle")
                                    .data(delawareDataset)
                                    .enter()
                                    .append("circle")
                                        .attr("cx", d => xScale(d[0]))
                                        .attr("cy", d => yScale(d[1]))
                                        .attr("r", 5)
                                        .attr("fill", "#e7298a")

            let totalLength = path.node().getTotalLength();

            path.attr("stroke-dasharray", totalLength + " " + totalLength)
                .attr("stroke-dashoffset", totalLength)
                .transition()
                    .duration(4000)
                    .attr("stroke-dashoffset", 0);

            let totalDELength = delawarePath.node().getTotalLength();

            delawarePath.attr("stroke-dasharray", totalDELength + " " + totalDELength)
                        .attr("stroke-dashoffset", totalDELength)
                        .transition()
                            .duration(4000)
                            .attr("stroke-dashoffset", 0);


            //Create axis-x and axis-y
            svg.append("g")
                .attr("class", "axis-x")
                .attr("transform", `translate(0, ${h - padding})`)
                .attr("color", "#555")
                .call(xAxis)
                .selectAll("text")
                .attr("font-size", "15px")
                .attr("color", "#000")
  
            svg.append("g")
                .attr("class", "axis-y")
                .attr("transform", `translate(${padding}, 0)`)
                .attr("color", "#555")
                .call(yAxis)
                .selectAll("text")
                .attr("font-size", "15px")
                .attr("color", "#000");

            //add label to each line
            svg.append("text")
                .attr("transform", `translate(${w - 100}, ${yScale(dataset[dataset.length - 1][1])})`)
                .attr("dy", ".35em")
                .attr("text-anchor", "start")
                .style("fill", "#a8ddb5")
                .transition()
                    .delay(4000)
                    .duration(400)
                .text("Riverside");

            svg.append("text")
                .attr("transform", `translate(${w - 100}, ${yScale(delawareDataset[delawareDataset.length - 1][1])})`)
                .attr("dy", ".35em")
                .attr("text-anchor", "start")
                .style("fill", "#e7298a")
                .transition()
                    .delay(4000)
                    .duration(400)
                .text("Delaware");

            //define event listeners for click, mouseover, mouseout
            circle.on("mouseover", (event, d) => {

                        d3.select(event.currentTarget)
                            .attr("fill", "#fd8d3c");

                        d3.select("#occupied")
                            .style("left", event.pageX + "px")
                            .style("top", event.pageY + "px")
                            .style("background-color", "#391D6A")
                            .selectAll("p")
                            .style("color", "#d95f02")
                            .select("#value")
                            .text(d3.format(".1%")(d[1]));

                        d3.select("#occupied")
                            .select("#year")
                            .text("Riverside " + d[0]); 
                            
                        d3.select("#occupied")
                            .select("#change")
                            .text(d[2])

                        d3.select("#occupied").classed("hidden", false);

                    })
                    .on("mouseout", (event, d) => {
                        d3.select(event.currentTarget)
                            .transition("restoreBarColor")
                            .duration(250)
                            .attr("fill",  d => "#a8ddb5");

                        d3.select("#occupied").classed("hidden", true);
                    });

            delawareCircle.on("mouseover", (event, d) => {

                                d3.select(event.currentTarget)
                                    .attr("fill", "#8c6bb1");

                                d3.select("#occupied")
                                    .style("left", event.pageX + "px")
                                    .style("top", event.pageY + "px")
                                    .style("background-color", "#8c6bb1")
                                    .selectAll("p")
                                    .style("color", "#4d004b")
                                    .select("#value")
                                    .text(d3.format(".1%")(d[1]));

                                d3.select("#occupied")
                                    .select("#year")
                                    .text("Delaware " + d[0]); 
                                    
                                d3.select("#occupied")
                                    .select("#change")
                                    .text(d[2])

                                d3.select("#occupied").classed("hidden", false);

                            })
                            .on("mouseout", (event, d) => {
                                d3.select(event.currentTarget)
                                    .transition("restoreBarColor")
                                    .duration(250)
                                    .attr("fill",  d => "#e7298a");

                                d3.select("#occupied").classed("hidden", true);
                            });
            
        }).catch((error) => {
            console.log(error);
        });
    }

    render() {
        return (
            <div className="occupied-percentage" style={{display: this.props.selectedStatsID === 1 ? "block" : "none"}}>
                <ChartHeader 
                    chartTitle="Rental units occupied percentage"
                    dotColor="#e7298a"
                />
                <ChartContainer 
                    containerRef={this.props.occupiedPercentageRef} 
                    tooltipID="occupied"
                    tooltipValueTitle="occupied percentage"
                    tooltipOption="out of units"
                />
                <ChartFooter chartSource="U.S. Department of Housing and Urban Development (HUD)." />
            </div>
        );
    }
}