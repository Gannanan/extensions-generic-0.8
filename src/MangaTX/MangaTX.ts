import {
    BadgeColor,
    ContentRating,
    PagedResults,
    PartialSourceManga,
    SearchRequest,
    SourceInfo,
    SourceIntents
} from '@paperback/types'
import {
    BasicAcceptedElems,
    CheerioAPI
} from 'cheerio'
import * as cheerio from 'cheerio'
import { AnyNode } from 'domhandler'

import {
    getExportVersion,
    MangaStream
} from '../MangaStream'
import {
    MangaTXParser
} from './MangaTXParser'
import {
    getFilterTagsBySection,
    getIncludedTagBySection
} from '../MangaStreamHelper'
import { URLBuilder } from '../UrlBuilder'

const DOMAIN = 'https://mangatx.cc'

export const MangaTXInfo: SourceInfo = {
    version: getExportVersion('0.0.2'),
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

    override async getViewMoreItems(homepageSectionId: string, metadata: any): Promise<PagedResults> {
        const page: number = metadata?.page ?? 1

        const request = App.createRequest({
            url: `${this.baseUrl}/?page=${page}`,
            method: 'GET'
        })

        const response = await this.requestManager.schedule(request, 1)
        const $ = cheerio.load(response.data as string)

        const items: PartialSourceManga[] = await this.parser.parseViewMore($, this)
        metadata = !this.parser.isLastPage($, 'view_more') ? { page: page + 1 } : undefined
        return App.createPagedResults({
            results: items,
            metadata
        })
    }

    override async getSearchResults(query: SearchRequest, metadata: any): Promise<PagedResults> {
        const page: number = metadata?.page ?? 1

        const request = await this.constructSearchRequest(page, query)
        const response = await this.requestManager.schedule(request, 1)
        this.checkResponseError(response)
        const $ = cheerio.load(response.data as string)
        const results = await this.parser.parseSearchResults($, this)

        const manga: PartialSourceManga[] = []
        for (const result of results) {
            let mangaId: string = result.slug
            if (await this.getUsePostIds()) {
                mangaId = await this.slugToPostId(result.slug, result.path)
            }

            manga.push(App.createPartialSourceManga({
                mangaId,
                image: result.image,
                title: result.title,
                subtitle: result.subtitle
            }))
        }

        metadata = !this.parser.isLastPage($, 'view_more') ? { page: page + 1 } : undefined
        return App.createPagedResults({
            results: manga,
            metadata
        })
    }

    override async constructSearchRequest(page: number, query: SearchRequest): Promise<any> {
        let urlBuilder: URLBuilder = new URLBuilder(this.baseUrl)
            .addPathComponent('manga-list')
        if (query?.title) {
            urlBuilder = urlBuilder
                .addQueryParameter('search', encodeURIComponent(query?.title.replace(/[’–][a-z]*/g, '') ?? ''))
                .addQueryParameter('page', page.toString())

        } else {
            urlBuilder = urlBuilder
                .addQueryParameter('genre', getFilterTagsBySection('genres', query?.includedTags, true))
                .addQueryParameter('genre', getFilterTagsBySection('genres', query?.excludedTags, false, await this.supportsTagExclusion()))
                .addQueryParameter('status', getIncludedTagBySection('status', query?.includedTags))
                .addQueryParameter('type', getIncludedTagBySection('type', query?.includedTags))
                .addQueryParameter('order', getIncludedTagBySection('order', query?.includedTags))
        }

        return App.createRequest({
            url: urlBuilder.buildUrl({ addTrailingSlash: true, includeUndefinedParameters: false }),
            method: 'GET'
        })
    }
}