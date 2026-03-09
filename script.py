import requests
import pandas as pd
import time
from datetime import datetime

# Configuración
SYMBOL = "BTCUSDT"
INTERVAL = "5m"
YEARS = 1  # Empieza con 1 año para probar. Si funciona bien, cámbialo a 5.
LIMIT = 1000

end_time = int(time.time() * 1000)
start_time = end_time - (YEARS * 365 * 24 * 60 * 60 * 1000)
all_klines = []

print(f"Descargando datos de {YEARS} año(s)... Esto tomará un par de minutos.")

while start_time < end_time:
    url = f"https://api.binance.com/api/v3/klines?symbol={SYMBOL}&interval={INTERVAL}&startTime={start_time}&limit={LIMIT}"
    response = requests.get(url)
    data = response.json()
    
    if not data or type(data) is dict: # Si hay error o no hay datos
        break
        
    all_klines.extend(data)
    start_time = data[-1][0] + 1 # Avanzar a la siguiente vela
    time.sleep(0.2) # Pausa pequeñita para que Binance no nos bloquee

print("Datos descargados. Procesando y calculando porcentajes...")

# Crear tabla con Pandas
df = pd.DataFrame(all_klines, columns=[
    'timestamp', 'open', 'high', 'low', 'close', 'volume', 
    'close_time', 'quote_asset_volume', 'number_of_trades', 
    'taker_buy_base', 'taker_buy_quote', 'ignore'
])

# Convertir tipos de datos
df['timestamp'] = pd.to_datetime(df['timestamp'], unit='ms')
df['open'] = df['open'].astype(float)
df['close'] = df['close'].astype(float)

# Lógica del Polymarket: ¿El cierre fue mayor o igual a la apertura? (UP)
df['is_up'] = df['close'] >= df['open']

# Sacar Día y Hora (0 = Lunes, 6 = Domingo en Python)
df['diaSemana'] = df['timestamp'].dt.dayofweek
df['hora'] = df['timestamp'].dt.strftime('%H:%M')

# Agrupar y sacar la media de "is_up" (Ej: 0.8 significa 80% de veces fue UP)
resumen = df.groupby(['diaSemana', 'hora'])['is_up'].mean().reset_index()
resumen['probabilidadUp'] = resumen['is_up'].round(4)

# Borrar columna extra y guardar como JSON
resumen = resumen[['diaSemana', 'hora', 'probabilidadUp']]
resumen.to_json('datos.json', orient='records')

print("¡Éxito! Archivo 'datos.json' generado correctamente en tu carpeta.")