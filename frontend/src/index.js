import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';

const HelloWorld = () => {
    return (
        <h1>
            <App/>
        </h1>
    );
}

ReactDOM.render(<HelloWorld />, document.getElementById("root"));
