import {
    BadgeColor,
    ContentRating,
    SourceInfo,
    SourceIntents
} from '@paperback/types'
import {
    BasicAcceptedElems,
    CheerioAPI
} from 'cheerio'
import { AnyNode } from 'domhandler'


import {
    getExportVersion,
    MangaStream
} from '../MangaStream'

import {
    MangaTXParser
} from './MangaTXParser'

const DOMAIN = 'https://mangatx.cc'

export const MangaTXInfo: SourceInfo = {
    version: getExportVersion('0.0.0'),
    name: 'MangaTX',
    description: `Extension that pulls manga from ${DOMAIN}`,
    author: 'Netsky',
    authorWebsite: 'http://github.com/TheNetsky',
    icon: 'icon.png',
    contentRating: ContentRating.ADULT,
    websiteBaseURL: DOMAIN,
    intents: SourceIntents.MANGA_CHAPTERS | SourceIntents.HOMEPAGE_SECTIONS | SourceIntents.CLOUDFLARE_BYPASS_REQUIRED | SourceIntents.SETTINGS_UI,
    sourceTags: [
        {
            text: '18+',
            type: BadgeColor.YELLOW
        }
    ]
}

export class MangaTX extends MangaStream {

    baseUrl: string = DOMAIN

    override usePostIds = false

    override configureSections() {
        this.homescreen_sections['new_titles'].enabled = false
        this.homescreen_sections['latest_update'].selectorFunc = ($: CheerioAPI) => $('div.bsx', $('h2:contains(Latest Update)')?.parent()?.next())
        this.homescreen_sections['latest_update'].subtitleSelectorFunc = ($: CheerioAPI, element: BasicAcceptedElems<AnyNode>) => $('div.epxs', element).first().text().trim()
    }

    override parser: MangaTXParser = new MangaTXParser()
}