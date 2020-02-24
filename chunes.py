from bs4 import BeautifulSoup
import webbrowser
import requests
import os
import sys
import csv

page = 1
lastPage = 0

user = 'MaxKrus'
timeframe = 'from=2020-01-01&to=2020-02-24'
siteURL = f'https://www.last.fm/user/{user}/library?{timeframe}&page={str(page)}'

print(siteURL)
isAllGathered = False
albumUrls = []

response = requests.get(siteURL)
soup = BeautifulSoup(response.text, 'html.parser')

pages = soup.find_all('li', class_='pagination-page')
lastPage = pages[len(pages) - 1].getText()

while (page <= int(lastPage)):
    print(page)
    siteURL = f'https://www.last.fm/user/{user}/library?{timeframe}&page={str(page)}'
    response = requests.get(siteURL)
    soup = BeautifulSoup(response.text, 'html.parser')

    for a in soup.find_all('a', class_='cover-art'):
        albumUrls.append(a.img['src'])
    page += 1

with open(f'{user}.txt', 'w', newline='') as file:
    for url in albumUrls:
        file.write(url+'\n')
