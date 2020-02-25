from bs4 import BeautifulSoup
import webbrowser
import requests
import os
import sys
import csv
import json
import datetime


user = 'MaxKrus'
timeframe = 'from=2020-01-01&to=2020-02-24'
siteURL = f'https://www.last.fm/user/{user}/library?{timeframe}'

data = {}
data['user'] = user
data['tracks'] = []
data['timeframe'] = timeframe

newTracks = []
lastSavedSong = None

filename = f'{user}.json'

if os.path.isfile(filename):
    with open(filename) as userTracksFile:
        data = json.load(userTracksFile)
        lastSavedSong = data['tracks'][-1]


# get total page count
response = requests.get(siteURL)
soup = BeautifulSoup(response.text, 'html.parser')
totalPages = int(soup.find_all('li', class_='pagination-page')[-1].getText())
page = 1
hasReachedSavedTrack = False

while (page <= totalPages and (not hasReachedSavedTrack)):
    print(f'scraping page {page}')
    siteURL = f'https://www.last.fm/user/{user}/library?{timeframe}&page={str(page)}'
    response = requests.get(siteURL)
    soup = BeautifulSoup(response.text, 'html.parser')

    for tr in soup.find_all('tr', class_='chartlist-row'):
        timestamp = tr.find('td', class_='chartlist-timestamp').span['title']
        name = tr.find('td', class_='chartlist-name').a['title']
        artist = tr.find('td', class_='chartlist-artist').a['title']
        url = tr.img['src']

        if (lastSavedSong is not None and timestamp == lastSavedSong['timestamp']):
            hasReachedSavedTrack = True
            break

        newTracks.append({
            'timestamp': timestamp,
            'name': name,
            'artist': artist,
            'url': url
        })
    page += 1

# add new tracks to lists

print(f'adding {len(newTracks)} new tracks')
data['tracks'] = data['tracks'] + newTracks[::-1]

with open(filename, 'w') as outfile:
    json.dump(data, outfile)
