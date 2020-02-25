from bs4 import BeautifulSoup
import webbrowser
import requests
import os
import sys
import csv
import json
import datetime

from flask import Flask

app = Flask(__name__)


@app.route('/tracks/<username>', methods=['GET'])
def getTracksForUser(username):
    return 'dog'
    # return getTracks(username)


def getTracks(user):
    user = 'MaxKrus'
    timeframe = 'from=2020-01-01&to=2020-02-24'
    siteURL = f'https://www.last.fm/user/{user}/library?{timeframe}'

    data = {}
    data['tracks'] = []
    data['user'] = user
    data['timeframe'] = timeframe

    # get total page count
    response = requests.get(siteURL)
    soup = BeautifulSoup(response.text, 'html.parser')
    totalPages = int(soup.find_all(
        'li', class_='pagination-page')[-1].getText())
    page = 1

    while (page <= totalPages):
        print(f'scraping page {page}')
        siteURL = f'https://www.last.fm/user/{user}/library?{timeframe}&page={str(page)}'
        response = requests.get(siteURL)
        soup = BeautifulSoup(response.text, 'html.parser')

        for tr in soup.find_all('tr', class_='chartlist-row'):
            timestamp = tr.find(
                'td', class_='chartlist-timestamp').span['title']
            name = tr.find('td', class_='chartlist-name').a['title']
            artist = tr.find('td', class_='chartlist-artist').a['title']
            url = tr.img['src']

            data['tracks'].append({
                'timestamp': timestamp,
                'name': name,
                'artist': artist,
                'url': url
            })
        page += 1

    return data
