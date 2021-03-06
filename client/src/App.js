import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import Cloud from './wordcloud';
import DropdownButton from 'react-bootstrap/DropdownButton';
import Dropdown from 'react-bootstrap/Dropdown';
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import moment from 'moment';
import SvgSaver from 'svgsaver';

const apigUrl = 'https://l1aycdz6w6.execute-api.us-west-1.amazonaws.com/dev';

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      error: null,
      isLoaded: false,
      words: [],
      books: [],
      book: null,
      day: moment().format('YYYY-MM-DD'),
    };
  }

  currentBook = () => this.state.books.find(
      book => book.book === this.state.book);

  loadBooks = (switchActive) => {
    fetch(`${apigUrl}/books`).
        then(res => res.json()).
        then(
            (result) => {
              this.setState({
                isLoaded: true,
                books: [...result.filter(book => book.started)].sort(
                    (a, b) => (a.started < b.started) ? 1 : -1),
              });
              if (switchActive) {
                this.loadWords(result.find(book => book.active)['book']);
              } else {
                if (this.state.book) {
                  this.loadWords(this.state.book);
                }
              }
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
  };

  loadWords = (book) => {
    console.log('loadWords', book);
    fetch(
        `${apigUrl}/words/${book}`).
        then(res => res.json()).
        then(
            (result) => {
              this.setState({
                isLoaded: true,
                words: result,
                book: book,
              });
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
  };

  clickLoadBook = (button) => {
    this.loadWords(button.target.id);
  };

  setDay = (button) => {
    this.setState({'day': button.target.id});
  };

  bookRawCsvHref = (book) => `${apigUrl}/bookcsv/${book}`;

  bookStatCsvHref = (book) => `${apigUrl}/wordcsv/${book}`;

  lineBook = (book) => `${book.book} ${book.active ?
      '*' :
      ''} [${book.started ?
      moment.utc(book.started).fromNow() :
      ''} - ${book.stopped ? moment.utc(book.stopped).fromNow() : 'active'}]`;

  startCountTimeout = () => {
    setInterval(() => {
      this.loadBooks();
    }, 60000);
  };

  downloadSvg = () => {
    var svgsaver = new SvgSaver();                      // creates a new instance
    var svg = document.querySelector('#chart');         // find the SVG element
    svgsaver.asSvg(svg, `${this.state.book}.svg`);
  };
  downloadPng = () => {
    var svgsaver = new SvgSaver();                      // creates a new instance
    var svg = document.querySelector('#chart');         // find the SVG element
    svgsaver.asPng(svg, `${this.state.book}.png`);
  };

  componentDidMount() {
    const {book} = this.state;
    console.log('componentDidMount', book);
    this.loadBooks(true);
    this.startCountTimeout();
  };

  render() {
    const {error, isLoaded} = this.state;
    if (error) {
      return <div>Error: {error.message}</div>;
    } else if (!isLoaded) {
      return <div>Loading...</div>;
    } else {
      return (
          <div className="App">
            <Navbar bg="light" variant="light">
              <Navbar.Brand href="#">SMS Word Cloud</Navbar.Brand>
              <Nav className="mr-auto">
                <DropdownButton id="dropdown-cloud" variant="secondary"
                                title="Pick a date">
                  {[
                    ...new Set(this.state.books.map(
                        book => moment(book.started).
                            format('YYYY-MM-DD')))].map(day => (
                      <Dropdown.Item as="button" id={day} key={day}
                                     onClick={this.setDay}>{day}</Dropdown.Item>
                  ))}
                </DropdownButton>
                <DropdownButton id="dropdown-cloud" title="Pick a cloud">
                  {this.state.books.filter(
                      book => moment(book.started).format('YYYY-MM-DD') ===
                          this.state.day).map(book => (
                      <Dropdown.Item as="button" key={book.book} id={book.book}
                                     onClick={this.clickLoadBook}>{this.lineBook(
                          book)}</Dropdown.Item>
                  ))}
                </DropdownButton>
                <Nav.Link href={this.bookRawCsvHref(this.state.book)}
                          target="_blank">messages.csv</Nav.Link>
                <Nav.Link href={this.bookStatCsvHref(this.state.book)}
                          target="_blank">stats.csv</Nav.Link>
                <Nav.Link onClick={this.downloadSvg}>cloud.svg</Nav.Link>
                <Nav.Link onClick={this.downloadPng}>cloud.png</Nav.Link>

              </Nav>
              <Nav className="mr-auto"><h1>{this.state.book}</h1></Nav>
              <Nav className="mr-fill">(778) 200-0862</Nav>
            </Navbar>
            <div className="App-body">

              <div id="chart" style={{width: '100%', height: '100%'}}>
                <Cloud words={this.state.words}/>
              </div>
            </div>
          </div>
      );
    }
  }
}

export default App;
