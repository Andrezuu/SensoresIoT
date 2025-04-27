import dash
from dash import dcc, html, Input, Output
import requests
import plotly.graph_objs as go

app = dash.Dash(__name__)
server = app.server  # Para desplegar con Flask si se desea

DEVICE_IDS = [1, 2, 3]  # Opcional: puede venir de la API

app.layout = html.Div([
    html.H1("Dashboard IoT"),
    dcc.Dropdown(id='device-dropdown', options=[{'label': f'Device {i}', 'value': i} for i in DEVICE_IDS], value=1),
    html.Div(id='status-card'),
    html.Div(id='stats-card'),
    dcc.Graph(id='temp-rssi-graph'),
    dcc.Interval(id='interval', interval=15*1000, n_intervals=0)
])

@app.callback(
    Output('status-card', 'children'),
    Input('interval', 'n_intervals'),
    Input('device-dropdown', 'value')
)
def update_status(_, device_id):
    # Simula ping/check
    try:
        response = requests.get(f"http://localhost:3000/query/{device_id}")
        if response.status_code == 200 and response.json():
            return html.Div(f"Device {device_id} ONLINE", style={'color': 'green'})
        else:
            return html.Div(f"Device {device_id} OFFLINE", style={'color': 'red'})
    except:
        return html.Div("Error al consultar estado", style={'color': 'orange'})

@app.callback(
    [Output('temp-rssi-graph', 'figure'),
    Output('stats-card', 'children')],
    Input('device-dropdown', 'value')
)
def update_data(device_id):
    stats = requests.get(f"http://localhost:5003/api/stats/{device_id}").json()
    raw = requests.get(f"http://localhost:3000/query/{device_id}").json()

    temps = [item['temperature'] for item in raw]
    rssis = [item['rssi'] for item in raw]
    timestamps = [item['timestamp'] for item in raw]

    fig = go.Figure()
    fig.add_trace(go.Scatter(x=timestamps, y=temps, name="Temp"))
    fig.add_trace(go.Scatter(x=timestamps, y=rssis, name="RSSI"))

    stats_card = html.Ul([
        html.Li(f"Media Temp: {stats['temperature_stats']['mean']:.2f}"),
        html.Li(f"Media RSSI: {stats['rssi_stats']['mean']:.2f}"),
        html.Li(f"Latencia: {stats['latency_ms']} ms"),
    ])

    return fig, stats_card

if __name__ == '__main__':
    app.run(debug=True, port=8050)
