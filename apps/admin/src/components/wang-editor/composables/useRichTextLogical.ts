import { resolveLogicalPaths } from '#/api/core/upload';

/**
 * 富文本「逻辑路径 ↔ 完整 URL」转换器。
 *
 * 背景：后端文件以 logicalPath（如 public://2026-03/abc.png）为唯一标识，
 * fullUrl 是运行时派生的——私有文件是带签名+TTL 的临时链接（会过期），
 * 公开文件在换域名/换 OSS 后前缀也会变。因此富文本正文必须以 logicalPath
 * 为准，不能把易变的 fullUrl 焊死进 HTML。
 *
 * 落地方式（data 属性方案）：
 *   - 入库前 dehydrate：把媒体元素上当前的 fullUrl 收敛为 data-logical，移除易变 src；
 *   - 渲染前 rehydrate：读取 data-logical，批量解析为新鲜 fullUrl 回填 src。
 *
 * 编辑器内部始终持有 fullUrl（图片才能正常显示），转换只发生在「进/出」边界，
 * 不依赖 wangEditor 是否保留自定义属性。
 */
export function useRichTextLogical() {
  /** fullUrl → logicalPath 反查表，上传时与 rehydrate 时填充 */
  const urlToLogical = new Map<string, string>();

  /** 媒体类元素（src 承载地址）选择器 */
  const MEDIA_SELECTOR = 'img, source, video';
  /** 附件元素：URL 承载在 href 上（由 @wangeditor/plugin-upload-attachment 渲染） */
  const ATTACHMENT_SELECTOR = 'a[data-w-e-type="attachment"]';

  function parse(html: string): Document {
    return new DOMParser().parseFromString(html, 'text/html');
  }

  /** 登记一次上传/解析得到的 fullUrl 与 logicalPath 的对应关系 */
  function register(fullUrl: string, logicalPath: string) {
    if (fullUrl && logicalPath) urlToLogical.set(fullUrl, logicalPath);
  }

  /**
   * 出站：把编辑器 HTML 中的 fullUrl 收敛为 data-logical（入库形态）。
   * 仅处理映射表中已知的本站资源；外链图片（粘贴的 http 地址）原样保留。
   * - 图片/视频：URL 在 src；附件：URL 在 href（download 存文件名、文字也是文件名，不动）。
   */
  function dehydrate(html: string): string {
    if (!html) return html;
    const doc = parse(html);

    for (const el of doc.body.querySelectorAll(MEDIA_SELECTOR)) {
      const src = el.getAttribute('src');
      const logicalPath = src ? urlToLogical.get(src) : undefined;
      if (logicalPath) {
        el.dataset.logical = logicalPath;
        el.removeAttribute('src');
      }
    }

    for (const el of doc.body.querySelectorAll(ATTACHMENT_SELECTOR)) {
      const href = el.getAttribute('href');
      const logicalPath = href ? urlToLogical.get(href) : undefined;
      if (logicalPath) {
        el.dataset.logical = logicalPath;
        el.removeAttribute('href');
      }
    }

    return doc.body.innerHTML;
  }

  /**
   * 入站：把入库形态的 data-logical 批量解析为新鲜 fullUrl 并回填 src/href。
   * 解析失败的条目跳过（保持 data-logical，不写死失效链接）。
   */
  async function rehydrate(html: string): Promise<string> {
    if (!html) return html;
    const doc = parse(html);
    const nodes = [...doc.body.querySelectorAll('[data-logical]')];
    if (nodes.length === 0) return html;

    const paths = [...new Set(nodes.map(n => n.dataset.logical).filter(Boolean) as string[])];
    const urlMap = await resolveLogicalPaths(paths);

    for (const node of nodes) {
      const logicalPath = node.dataset.logical;
      const fullUrl = logicalPath ? urlMap[logicalPath] : '';
      if (!logicalPath || !fullUrl) continue;

      register(fullUrl, logicalPath);
      const tag = node.tagName.toLowerCase();
      if (tag === 'img' || tag === 'source' || tag === 'video') {
        node.setAttribute('src', fullUrl);
      } else {
        // 附件 a[data-w-e-type=attachment]：URL 回填到 href
        node.setAttribute('href', fullUrl);
      }
    }

    return doc.body.innerHTML;
  }

  return { register, dehydrate, rehydrate };
}
