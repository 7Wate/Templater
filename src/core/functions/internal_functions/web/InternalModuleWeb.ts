import { TemplaterError } from "utils/Error";
import { InternalModule } from "../InternalModule";
import { ModuleName } from "editor/TpDocumentation";

export class InternalModuleWeb extends InternalModule {
    name: ModuleName = "web";

    async create_static_templates(): Promise<void> {
        this.static_functions.set("daily_quote", this.generate_daily_quote());
        this.static_functions.set("random_picture", this.generate_random_picture());
        this.static_functions.set("today_poetry", this.generate_today_poetry());
        this.static_functions.set("lunar_date", this.get_lunar_date());
        this.static_functions.set("weather", this.get_weather());
        this.static_functions.set("hitokoto", this.get_hitokoto());
    }

    async create_dynamic_templates(): Promise<void> {}

    async teardown(): Promise<void> {}

    async getRequest(url: string): Promise<Response> {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new TemplaterError("Error performing GET request");
            }
            return response;
        } catch (error) {
            throw new TemplaterError("Error performing GET request");
        }
    }

    generate_today_poetry(): () => Promise<string> {
        return async () => {
            try {
                const response = await this.getRequest("https://v2.jinrishici.com/one.json");
                const json = await response.json();
                if (json.status === "success") {
                    const poetryContent = json.data.content;
                    const author = json.data.origin.author;
                    const dynasty = json.data.origin.dynasty;
                    return `${poetryContent}——${author}（${dynasty}）`;
                } else {
                    throw new TemplaterError("Failed to fetch poetry");
                }
            } catch (error) {
                throw new TemplaterError("Error fetching today's poetry");
            }
        };
    }

    get_lunar_date(): () => Promise<string> {
        return async () => {
            try {
                const response = await this.getRequest("https://api.timelessq.com/time");
                const json = await response.json();
                if (json.errno === 0) {
                    const lunar = json.data.lunar;
                    return `${lunar.cyclicalYear}${lunar.zodiac}年 ${lunar.cyclicalMonth}月 ${lunar.cyclicalDay}日 农历${lunar.cnMonth}${lunar.cnDay}`;
                } else {
                    throw new TemplaterError("Failed to fetch lunar date");
                }
            } catch (error) {
                throw new TemplaterError("Error fetching lunar date");
            }
        };
    }

    get_weather(): (city: string, params?: string) => Promise<string> {
        return async (city: string = "Shanghai", params: string = "format=3") => {
            try {
                let url = `https://wttr.7wate.com/${encodeURIComponent(city)}`;
                if (params) {
                    url += `?${params}`;
                }
                const response = await this.getRequest(url);
                const data = await response.text();
                return data;
            } catch (error) {
                throw new TemplaterError("Error fetching weather");
            }
        };
    }
    

    get_hitokoto(options = { c: undefined, encode: 'json', charset: undefined, callback: undefined, select: undefined, min_length: undefined, max_length: undefined }): () => Promise<string> {
        return async () => {
            try {
                let url = 'https://v1.hitokoto.cn?';
                if (options.c) url += `&c=${options.c}`;
                if (options.encode) url += `&encode=${options.encode}`;
                if (options.charset) url += `&charset=${options.charset}`;
                if (options.callback) url += `&callback=${options.callback}`;
                if (options.select) url += `&select=${options.select}`;
                if (options.min_length) url += `&min_length=${options.min_length}`;
                if (options.max_length) url += `&max_length=${options.max_length}`;

                const response = await this.getRequest(url);
                const json = await response.json();
                return json.hitokoto;
            } catch (error) {
                throw new TemplaterError("Error fetching hitokoto");
            }
        };
    }

    generate_daily_quote(): () => Promise<string> {
        return async () => {
            try {
                const response = await this.getRequest("https://api.quotable.io/random");
                const json = await response.json();
                const author = json.author;
                const quote = json.content;
                const new_content = `> [!quote] ${quote}\n> — ${author}`;
                return new_content;
            } catch (error) {
                throw new TemplaterError("Error generating daily quote");
            }
        };
    }

    generate_random_picture(): (size: string, query?: string, include_size?: boolean) => Promise<string> {
        return async (size: string, query?: string, include_size = false) => {
            try {
                const response = await this.getRequest(
                    `https://templater-unsplash.fly.dev/${query ? "?q=" + query : ""}`
                );
                const json = await response.json();
                let url = json.full;
                if (size && !include_size) {
                    if (size.includes("x")) {
                        const [width, height] = size.split("x");
                        url = url.concat(`&w=${width}&h=${height}`);
                    } else {
                        url = url.concat(`&w=${size}`);
                    }
                }
                if (include_size) {
                    return `![photo by ${json.photog} on Unsplash|${size}](${url})`;
                }
                return `![photo by ${json.photog} on Unsplash](${url})`;
            } catch (error) {
                throw new TemplaterError("Error generating random picture");
            }
        };
    }
}
