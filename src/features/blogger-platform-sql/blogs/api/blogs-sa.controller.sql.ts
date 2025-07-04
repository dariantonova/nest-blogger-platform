import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { GetBlogsQueryParams } from '../../../blogger-platform/blogs/api/input-dto/get-blogs-query-params.input-dto';
import { PaginatedViewDto } from '../../../../core/dto/base.paginated.view-dto';
import { BasicAuthGuard } from '../../../user-accounts/guards/basic/basic-auth.guard';
import { GetBlogsQuerySql } from '../application/queries/get-blogs.query.sql';
import { CreateBlogInputDto } from '../../../blogger-platform/blogs/api/input-dto/create-blog.input-dto';
import { CreateBlogCommandSql } from '../application/usecases/create-blog.usecase.sql';
import { GetBlogByIdOrInternalFailQuerySql } from '../application/queries/get-blog-by-id-or-internal-fail.query.sql';
import { UpdateBlogInputDto } from '../../../blogger-platform/blogs/api/input-dto/update-blog.input-dto';
import { UpdateBlogCommandSql } from '../application/usecases/update-blog.usecase.sql';
import { DeleteBlogCommandSql } from '../application/usecases/delete-blog.usecase.sql';
import { GetPostsQueryParams } from '../../../blogger-platform/posts/api/input-dto/get-posts-query-params.input-dto';
import { GetBlogPostsQuerySql } from '../../posts/application/queries/get-blog-posts.query.sql';
import { CreateBlogPostInputDto } from '../../../blogger-platform/blogs/api/input-dto/create-blog-post.input-dto';
import { CreatePostCommandSql } from '../../posts/application/usecases/create-post.usecase.sql';
import { GetPostByIdOrInternalFailQuerySql } from '../../posts/application/queries/get-post-by-id-or-internal-fail.query.sql';
import { UpdateBlogPostInputDtoSql } from './input-dto/update-blog-post.input-dto.sql';
import { UpdateBlogPostCommandSql } from '../../posts/application/usecases/update-blog-post.usecase.sql';
import { DeleteBlogPostCommandSql } from '../../posts/application/usecases/delete-blog-post.usecase.sql';
import { BlogViewDto } from '../../../blogger-platform/blogs/api/view-dto/blogs.view-dto';
import { PostViewDto } from '../../../blogger-platform/posts/api/view-dto/posts.view-dto';

// @Controller('sql/sa/blogs')
@Controller('sa/blogs')
@UseGuards(BasicAuthGuard)
export class BlogsSaControllerSql {
  constructor(
    private commandBus: CommandBus,
    private queryBus: QueryBus,
  ) {}

  @Get()
  async getBlogs(
    @Query() query: GetBlogsQueryParams,
  ): Promise<PaginatedViewDto<BlogViewDto[]>> {
    return this.queryBus.execute(new GetBlogsQuerySql(query));
  }

  @Post()
  async createBlog(@Body() body: CreateBlogInputDto): Promise<BlogViewDto> {
    const createdBlogId = await this.commandBus.execute<
      CreateBlogCommandSql,
      number
    >(new CreateBlogCommandSql(body));

    return this.queryBus.execute(
      new GetBlogByIdOrInternalFailQuerySql(createdBlogId),
    );
  }

  @Put(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateBlog(
    @Param(
      'id',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_FOUND }),
    )
    id: number,
    @Body() body: UpdateBlogInputDto,
  ): Promise<void> {
    await this.commandBus.execute(new UpdateBlogCommandSql(id, body));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteBlog(
    @Param(
      'id',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_FOUND }),
    )
    id: number,
  ): Promise<void> {
    await this.commandBus.execute(new DeleteBlogCommandSql(id));
  }

  @Get(':blogId/posts')
  async getBlogPosts(
    @Param(
      'blogId',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_FOUND }),
    )
    blogId: number,
    @Query() query: GetPostsQueryParams,
  ): Promise<PaginatedViewDto<PostViewDto[]>> {
    return this.queryBus.execute(
      new GetBlogPostsQuerySql(blogId, query, undefined),
    );
  }

  @Post(':blogId/posts')
  async createBlogPost(
    @Param(
      'blogId',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_FOUND }),
    )
    blogId: number,
    @Body() body: CreateBlogPostInputDto,
  ): Promise<PostViewDto> {
    const createdPostId = await this.commandBus.execute<
      CreatePostCommandSql,
      number
    >(
      new CreatePostCommandSql({
        title: body.title,
        shortDescription: body.shortDescription,
        content: body.content,
        blogId,
      }),
    );

    return this.queryBus.execute(
      new GetPostByIdOrInternalFailQuerySql(createdPostId, undefined),
    );
  }

  @Put(':blogId/posts/:postId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateBlogPost(
    @Param(
      'blogId',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_FOUND }),
    )
    blogId: number,
    @Param(
      'postId',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_FOUND }),
    )
    postId: number,
    @Body() body: UpdateBlogPostInputDtoSql,
  ): Promise<void> {
    await this.commandBus.execute(
      new UpdateBlogPostCommandSql(blogId, postId, body),
    );
  }

  @Delete(':blogId/posts/:postId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteBlogPost(
    @Param(
      'blogId',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_FOUND }),
    )
    blogId: number,
    @Param(
      'postId',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_FOUND }),
    )
    postId: number,
  ): Promise<void> {
    await this.commandBus.execute(new DeleteBlogPostCommandSql(blogId, postId));
  }
}
