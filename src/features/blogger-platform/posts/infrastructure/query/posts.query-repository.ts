import { GetPostsQueryParams } from '../../api/input-dto/get-posts-query-params.input-dto';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated.view-dto';
import { PostViewDto } from '../../api/view-dto/posts.view-dto';
import { FilterQuery } from 'mongoose';
import { SortDirection } from '../../../../../core/dto/base.query-params.input-dto';
import { Post, PostDocument, PostModelType } from '../../domain/post.entity';
import { InjectModel } from '@nestjs/mongoose';
import { ObjectId } from 'mongodb';
import { Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class PostsQueryRepository {
  constructor(
    @InjectModel(Post.name)
    private PostModel: PostModelType,
  ) {}

  async findPosts(
    query: GetPostsQueryParams,
  ): Promise<PaginatedViewDto<PostViewDto[]>> {
    const filter: FilterQuery<Post> = {
      deletedAt: null,
    };

    const posts = await this.PostModel.find(filter)
      .sort({
        [query.sortBy]: query.sortDirection === SortDirection.Asc ? 1 : -1,
        _id: 1,
      })
      .skip(query.calculateSkip())
      .limit(query.pageSize);

    const totalCount = await this.PostModel.countDocuments(filter);

    const items = posts.map(PostViewDto.mapToView);

    return PaginatedViewDto.mapToView<PostViewDto[]>({
      items,
      totalCount,
      page: query.pageNumber,
      pageSize: query.pageSize,
    });
  }

  async findById(id: string): Promise<PostDocument | null> {
    return this.PostModel.findOne({
      _id: new ObjectId(id),
      deletedAt: null,
    });
  }

  async findByIdOrNotFoundFail(id: string): Promise<PostViewDto> {
    const post = await this.findById(id);

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return PostViewDto.mapToView(post);
  }

  async findByIdOrInternalFail(id: string): Promise<PostViewDto> {
    const post = await this.findById(id);

    if (!post) {
      throw new Error('Post not found');
    }

    return PostViewDto.mapToView(post);
  }

  async countBlogPosts(blogId: string): Promise<number> {
    return this.PostModel.countDocuments({
      blogId,
      deletedAt: null,
    });
  }
}
