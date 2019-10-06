import React from 'react';
import './App.css';
import * as d3 from 'd3';
import * as d3Cloud from 'd3-cloud';
import debugWords from './words';

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      error: null,
      isLoaded: false,
      words: [],
    };
  }

  d3Chart(words) {
    var fillScale = d3.scaleOrdinal(d3.schemeCategory10);
    const wordSizes = words.filter(w => w.value > 1).map(w => w.value);
    var sizeScale = d3.scaleLinear().range([10, 100]).domain([Math.min(...wordSizes),Math.max(...wordSizes)]);
    console.log([Math.min(...wordSizes),Math.max(...wordSizes)]);

    var layout = d3Cloud().size([800, 500]).words(words.filter(w => w.value > 1).map(function(w) {
      return {text: w.text, size: sizeScale(w.value)};
    })).padding(5).rotate(function() {
      return 0;
    }).font('Verdana').fontWeight('bold').fontSize(function(d) {
      return d.size;
    }).on('end', draw);

    layout.start();

    function draw(words) {
      d3.select('#chart').
          append('svg').
          attr('width', layout.size()[0]).
          attr('height', layout.size()[1]).
          append('g').
          attr('transform', 'translate(' + layout.size()[0] / 2 + ',' +
              layout.size()[1] / 2 + ')').
          selectAll('text').
          data(words).
          enter().
          append('text').
          style('font-size', function(d) {
            return d.size + 'px';
          }).
          style('font-family', 'Verdana').
          style('font-weight', 'bold').
          attr('text-anchor', 'middle').
          attr('transform', function(d) {
            return 'translate(' + [d.x, d.y] + ')rotate(' + d.rotate + ')';
          }).
          style('fill', t => {
            return fillScale(t.text);
          }).
          text(function(d) {
            return d.text;
          });
    }

  }

  loadWords() {
    this.setState({
      isLoaded: true,
      words: debugWords,
    });
    this.d3Chart(debugWords);
    fetch('https://l1aycdz6w6.execute-api.us-west-1.amazonaws.com/dev/words').
        then(res => res.json()).
        then(
            (result) => {
              this.setState({
                isLoaded: true,
                words: result,
              });
              this.d3Chart(result);
            },
            // Note: it's important to handle errors here
            // instead of a catch() block so that we don't swallow
            // exceptions from actual bugs in components.
            (error) => {
              this.setState({
                isLoaded: true,
                error,
              });
            },
        );
  }

  componentDidMount() {
    this.loadWords();
  }

  render() {
    const {error, isLoaded, words} = this.state;
    if (error) {
      return <div>Error: {error.message}</div>;
    } else if (!isLoaded) {
      return <div>Loading...</div>;
    } else {
      return (
          <div className="App">
            <header className="App-header">
              SMS Word Cloud
            </header>
            <div className="App-body">
              <div id="chart" style={{width: '100%', height: '100%'}}>
                blah
              </div>
            </div>
          </div>
      );
    }
  }
}

export default App;
