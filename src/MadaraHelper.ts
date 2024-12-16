export class URLBuilder {
    parameters: Record<string, any | any[]> = {}
    pathComponents: string[] = []
    baseUrl: string
    constructor(baseUrl: string) {
        this.baseUrl = baseUrl.replace(/(^\/)?(?=.*)(\/$)?/gim, '')
    }

    addPathComponent(component: string): URLBuilder {
        this.pathComponents.push(component.replace(/(^\/)?(?=.*)(\/$)?/gim, ''))
        return this
    }

    addQueryParameter(key: string, value: any | any[]): URLBuilder {
        this.parameters[key] = value
        return this
    }

    buildUrl({ addTrailingSlash, includeUndefinedParameters } = { addTrailingSlash: false, includeUndefinedParameters: false }): string {
    let finalUrl = this.baseUrl + '/';

    finalUrl += this.pathComponents.join('/');
    finalUrl += addTrailingSlash ? '/' : '';
    finalUrl += Object.keys(this.parameters).length > 0 ? '?' : '';

    finalUrl += Object.entries(this.parameters).map(([key, value]) => {
        if (value == null && !includeUndefinedParameters) {
            return undefined;
        }

        // Gestione degli array con numerazione progressiva (es. genre[0], genre[1])
        if (Array.isArray(value)) {
            return value
                .map((v, index) => v || includeUndefinedParameters ? `${key}[${index}]=${v}` : undefined)
                .filter(x => x !== undefined)
                .join('&');
        }

        // Gestione dei parametri senza valore (es. s, author, artist)
        if (value === '' || value == null) {
            return key;
        }

        return `${key}=${value}`;
    }).filter(x => x !== undefined).join('&');

    return finalUrl;
}

}
