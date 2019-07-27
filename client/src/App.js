import React from 'react';
import './App.css';
import ReactWordcloud from 'react-wordcloud';

class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            error: null,
            isLoaded: false,
            words: []
        };
    }

    loadWords() {
        fetch("https://l1aycdz6w6.execute-api.us-west-1.amazonaws.com/dev/words")
            .then(res => res.json())
            .then(
                (result) => {
                    this.setState({
                        isLoaded: true,
                        words: result
                    });
                },
                // Note: it's important to handle errors here
                // instead of a catch() block so that we don't swallow
                // exceptions from actual bugs in components.
                (error) => {
                    this.setState({
                        isLoaded: true,
                        error
                    });
                }
            )
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
                        <div style={{width: '100%', height: '100%'}}>
                            <ReactWordcloud words={words}/>
                        </div>
                    </div>
                </div>
            );
        }
    }
}

export default App;
