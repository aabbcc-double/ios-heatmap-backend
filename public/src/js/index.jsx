const React = require('react');
const ReactDOM = require('react-dom');
const root = document.getElementById("container");

const Heatmap = React.createClass({
        getInitialState: function () {
                return {
                        scenes: [],
                        current: null
                }
        },

        renderScenesSelect: function () {
                const options = this.state.scenes.map(scene => <option key={scene} value={scene}>{scene}</option>);

                const onChangeHandler = (e) => {
                        this.setState({
                                current: e.target.value
                        })
                }

                return <select value={this.state.current} onChange={onChangeHandler}>
                        {options}
                </select>
        },

        renderSelectBackground: function () {

        },

        heatmapInstance: null,
        componentDidMount: function () {
                const api = require('./apiClient');
                api.res("touches").res("scenes").get().then(response => {
                        if (response.meta.code != 0) return Promise.reject(response);

                        this.setState({
                                scenes: response.data,
                                current: response.data[0],
                        }, () => {
                                const heatmap = require('heatmap.js');
                                this.heatmapInstance = heatmap.create({
                                        container: document.getElementById("heatmap_container"),
                                        maxOpacity: 0.5,
                                });
                        });
                })
        },

        componentDidUpdate: function () {
                const api = require('./apiClient');
                const scene = this.state.current;
                api.res("touches").res("scene").res(scene).get().then(response => {
                        if (response.meta.code != 0) return Promise.reject(response);

                        const points = {
                                max: response.data.maxHeight,
                                min: response.data.minHeight,
                                data: response.data.data.map(p => {
                                        p.value = p.height;
                                        delete p.height;
                                        return p;
                                })
                        }

                        this.heatmapInstance.setData(points);
                })
        },

        componentWillUnmount: function () {

        },

        render: function () {
                const scenes = this.state.scenes;
                if (!scenes || !scenes.length) {
                        return <span>Loading...</span>
                }

                const currentScene = this.state.current;

                const sceneSelect = this.renderScenesSelect();
                const selectBackground = this.renderSelectBackground();

                const actionContainerStyle = {
                        position: "fixed",
                        top: 0,
                        right: 0,
                        zIndex: 9999
                }

                const containerStyle = {
                        position: "absolute",
                        width: "100%",
                        height: "100%"
                }

                const host = require('./host');
                return <div id="heatmap_container" style={containerStyle}>
                        <img src={`${host}/images/${currentScene}`}/>
                        <div style={actionContainerStyle}>
                                {selectBackground}
                                {sceneSelect}
                        </div>
                </div>
        }
});

ReactDOM.render(<Heatmap />, root);