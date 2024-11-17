import {
    ChapterDetails
} from '@paperback/types'
import { CheerioAPI } from 'cheerio'

import {
    MangaStreamParser
} from '../MangaStreamParser'


export class MangaTXParser extends MangaStreamParser {

    override parseChapterDetails($: CheerioAPI, mangaId: string, chapterId: string): ChapterDetails {
        const pages: string[] = []

        for (const img of $('img', '#readerarea').toArray()) {
            const image = $(img).attr('src') ?? ''
            if (!image) continue
            pages.push(image)
        }

        const chapterDetails = App.createChapterDetails({
            id: chapterId,
            mangaId: mangaId,
            pages: pages
        })

        return chapterDetails
    }
}