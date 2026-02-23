import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";

const contentDirectory = path.join(process.cwd(), "content/blog");

export interface BlogPost {
    slug: string;
    title: string;
    date: string;
    author: string;
    excerpt: string;
    coverImage?: string;
    contentHtml: string;
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
    const fullPath = path.join(contentDirectory, `${slug}.md`);

    try {
        const fileContents = fs.readFileSync(fullPath, "utf8");

        // Use gray-matter to parse the post metadata section
        const matterResult = matter(fileContents);

        // Use remark to convert markdown into HTML string
        const processedContent = await remark()
            .use(html)
            .process(matterResult.content);
        const contentHtml = processedContent.toString();

        return {
            slug,
            contentHtml,
            title: matterResult.data.title,
            date: matterResult.data.date,
            author: matterResult.data.author,
            excerpt: matterResult.data.excerpt,
            coverImage: matterResult.data.coverImage,
        };
    } catch {
        return null;
    }
}

export function getAllPosts(): Omit<BlogPost, "contentHtml">[] {
    if (!fs.existsSync(contentDirectory)) {
        return [];
    }

    // Get file names under /content/blog
    const fileNames = fs.readdirSync(contentDirectory);

    const allPostsData = fileNames
        .filter((fileName) => fileName.endsWith(".md"))
        .map((fileName) => {
            // Remove ".md" from file name to get slug
            const slug = fileName.replace(/\.md$/, "");

            // Read markdown file as string
            const fullPath = path.join(contentDirectory, fileName);
            const fileContents = fs.readFileSync(fullPath, "utf8");

            // Use gray-matter to parse the post metadata section
            const matterResult = matter(fileContents);

            // Combine the data with the id
            return {
                slug,
                title: matterResult.data.title,
                date: matterResult.data.date,
                author: matterResult.data.author,
                excerpt: matterResult.data.excerpt,
                coverImage: matterResult.data.coverImage,
            };
        });

    // Sort posts by date
    return allPostsData.sort((a, b) => {
        if (a.date < b.date) {
            return 1;
        } else {
            return -1;
        }
    });
}
