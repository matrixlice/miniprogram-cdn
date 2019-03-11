///<reference lib="es2015.core"/>

const COMPRESS_PREFIX = /*#__PURE__*/ "?basic=";

/**
 * 获取文件后缀
 * @param path 文件名
 */
export function isGif(path: string): boolean {
    return path && path.toLowerCase().endsWith(".gif");
}

/**
 * URL预处理
 */
function replaceUrl(url: string, domainList: Array<string | RegExp>, cdnSite: string): string {
    if (typeof url !== "string") {
        console.error("invalid url<not string>:", url);
    } else {
        url = url.split(COMPRESS_PREFIX)[0];
        domainList.forEach(e => (url = url.replace(e, cdnSite)));
    }
    return url;
}

/**
 * 配置信息
 */
class Config {
    /**
     * 宽度
     */
    public Width = 768;

    /**
     * 屏幕高度
     */
    public Height = 1024;
    /**
     * 图片质量1~100
     */
    public Quality = 100;

    /**
     * 缩略图宽度
     */
    public ThumbnailWidth = 138;

    /**
     * 缩略图宽度1~100
     */
    public ThumbnailQuality = 1;

    /**
     * 代替换的域名列表
     */
    public DomainList = [] as Array<string | RegExp>;

    /**
     * 图片处理CDN
     */
    public ImageCDN = "";

    /**
     * 媒体流加速CDN
     */
    public StreamCDN = "";

    public readonly isAndroid = false;

    constructor() {
        //@ts-ignore
        if (typeof wx === "object" && wx.getSystemInfo) {
            wx.getSystemInfo({
                success: res => {
                    //@ts-ignore
                    this.isAndroid = res.platform !== "ios";
                    this.Width = Math.round((res.windowWidth || res.screenWidth) * res.pixelRatio) || this.Width;
                    if (this.Width > 4096) {
                        this.Width = 4096;
                    }
                    this.Height = Math.round((res.screenHeight || res.windowWidth) * res.pixelRatio) || this.Height;
                    if (this.Width > 4096) {
                        this.Width = 4096;
                    }
                },
            });
        }
    }
}

export const config = /*#__PURE__*/ new Config();

/**
 * 生成压缩URL
 * @param option 压缩参数
 * @param cdnSite CDN域名 如 `https://mycdn.net/` 空则不替换
 * @param domainList 域名列表 `[/^https?:\/\/[\w\-\.]*\//]`
 */
export function compress(
    option: CDNOptions,
    cdnSite?: string,
    domainList: Array<string | RegExp> = [/^https?:\/\/[\w\-\.]*\//],
): string {
    const url = cdnSite ? replaceUrl(option.url, domainList, cdnSite) : cdnSite;
    // //gif图不处理
    // if (ext === "gif") {
    //     return url;
    // }

    let param: string = "";
    if (option.width) {
        param += `_${option.width}w`;
    }
    if (option.height) {
        param += `_${option.height}h`;
    }
    if (option.quality && option.quality < 100) {
        param += `_${option.quality}q`;
    }
    if (option.progressive) {
        param += `_1pr`;
    }
    if (option.scaleType) {
        param += `_${option.scaleType}e`;
    }
    if (option.cut) {
        param += `_1c`;
    }
    if (option.ext) {
        param += option.ext;
    }

    return param ? url + COMPRESS_PREFIX + (option.handleiflarger ? "1l" : "0l") + param : url;
}

/**
 * 屏幕宽度自适应图像
 * @param url url of image
 */
export function adaptiveImage(url: string): string {
    return compress(
        {
            url: url,
            width: config.Width,
            quality: config.Quality,
            progressive: config.Width > 800,
            ext: isGif(url) ? ".gif" : config.isAndroid ? ".webp" : ".jpg",
        },
        config.ImageCDN,
        config.DomainList,
    );
}

/**
 * 横屏自适应图像
 * @param url url of image
 */
export function adaptiveLandscapeImage(url: string): string {
    const width = config.Width > config.Height ? config.Width : config.Height;
    return isGif(url)
        ? url // gif 不处理
        : compress(
              {
                  url: url,
                  width: width,
                  quality: config.Quality,
                  progressive: width > 800,
                  ext: config.isAndroid ? ".webp" : ".jpg",
              },
              config.ImageCDN,
              config.DomainList,
          );
}

/**
 * 渐进式加载大图
 * @param url image URL
 */
export function progressiveImage(url: string): string {
    return isGif(url)
        ? url // gif 不处理
        : compress(
              {
                  url: url,
                  progressive: true,
                  ext: config.isAndroid ? ".webp" : ".jpg",
              },
              config.ImageCDN,
              config.DomainList,
          );
}

/**
 * 生成好友对话消息的缩略图
 * @param url image Url
 */
export function shareImage(url: string): string {
    return compress(
        {
            url: url,
            width: 500,
            height: 400,
            cut: true,
            scaleType: 1,
            quality: 75,
            ext: ".jpg",
        },
        config.ImageCDN,
        config.DomainList,
    );
}

/**
 * 小尺寸缩略图
 * @param url 原url
 */
export function thumbnail(url: string): string {
    return compress(
        {
            url: url,
            width: config.ThumbnailWidth,
            quality: config.ThumbnailQuality,
            ext: ".jpg",
        },
        config.ImageCDN,
        config.DomainList,
    );
}

/**
 * 流媒体
 * @param url 原url
 */
export function streamCdn(url: string): string {
    return config.StreamCDN ? replaceUrl(url, config.DomainList, config.StreamCDN) : url;
}

/**
 * CDN 压缩参数
 */
export interface CDNOptions {
    /**
     * 原始URL
     */
    url: string;
    /**
     * 0 或 不定义	锁定宽高比且长边优先
    1	锁定宽高比且短边优先
    2	强制宽高
    4	锁定宽高比且短边优先，并在缩放后以指定颜色填充空白区域（若颜色未指定则自动采用白色填充
     */
    scaleType?: 0 | 1 | 2 | 4;
    /**
     * 值为 0 或 1 的整数，默认为 0 即不进行其他操作，为1则自动裁剪原图至指定尺寸
     */
    cut?: boolean;
    /**
     * 输出宽度
     */
    width?: number;
    /**
     * 输出高度
     */
    height?: number;
    /**
     * 图片质量默认100
     */
    quality?: number;
    /**
     * 是否渐进加载
     */
    progressive?: boolean;
    /**
     * 图片过大是否处理
     */
    handleiflarger?: boolean;
    /**
     * 输出格式
     */
    ext?: ".jpg" | ".webp" | ".png" | ".jpeg" | ".gif";
}

declare namespace wx {
    export function getSystemInfo(o: object);
}
