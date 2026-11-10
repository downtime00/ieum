import { Controller, Get, Post, Delete, Body, Param, Query, ParseIntPipe, Header } from '@nestjs/common';
import { BoardService } from '../services/board.service';
import { ZodValidationPipe } from '../../common/validation/zod.validation.pipe';
import { createPostSchema, createCommentSchema, createFamilySchema, joinFamilySchema } from '../dto/board.dto';
import type { CreatePostDto, CreateCommentDto, CreateBoardFamilyDto, JoinFamilyDto } from '../dto/board.dto';

@Controller('board')
export class BoardController {
  constructor(private readonly boardService: BoardService) {}

  /** 가족 나가기 */
  @Post('families/:id/leave')
  leaveFamily(@Param('id', ParseIntPipe) id: number, @Body('userId') userId: number) {
    return this.boardService.leaveFamily(id, Number(userId));
  }

  /** 댓글 허용/비허용 설정 (가족장, 공개 그룹은 멤버) */
  @Post('families/:id/comments-enabled')
  setCommentsEnabled(
    @Param('id', ParseIntPipe) id: number,
    @Body('userId') userId: number,
    @Body('enabled') enabled: boolean | string,
  ) {
    const en = enabled === true || enabled === 'true';
    return this.boardService.setCommentsEnabled(id, Number(userId), en);
  }

  /** 구성원 내보내기 (가족장) */
  @Post('families/:id/members/:memberId/remove')
  removeMember(
    @Param('id', ParseIntPipe) id: number,
    @Param('memberId', ParseIntPipe) memberId: number,
    @Body('userId') userId: number,
  ) {
    return this.boardService.removeMember(id, memberId, Number(userId));
  }

  /** 공개 그룹 검색 */
  @Get('groups')
  @Header('Cache-Control', 'no-store')
  searchGroups(@Query('keyword') keyword: string | undefined, @Query('userId', ParseIntPipe) userId: number) {
    return this.boardService.searchGroups(keyword, userId);
  }

  /** 공개 그룹 가입 */
  @Post('groups/:id/join')
  joinGroup(@Param('id', ParseIntPipe) id: number, @Body('userId') userId: number) {
    return this.boardService.joinGroup(id, Number(userId));
  }

  /** 가족 생성 */
  @Post('families')
  createFamily(@Body(new ZodValidationPipe(createFamilySchema)) data: CreateBoardFamilyDto) {
    return this.boardService.createFamily(data);
  }

  /** 초대 코드로 가족 참가 */
  @Post('families/join')
  joinFamily(@Body(new ZodValidationPipe(joinFamilySchema)) data: JoinFamilyDto) {
    return this.boardService.joinFamily(data);
  }

  /** 초대 코드 발급/조회 (가족장) — QR 코드 생성용 */
  @Post('families/:id/invite-code')
  getInviteCode(
    @Param('id', ParseIntPipe) id: number,
    @Body('userId') userId: number,
    @Body('regenerate') regenerate?: boolean,
  ) {
    return this.boardService.getOrCreateInviteCode(id, Number(userId), !!regenerate);
  }

  /** 가족 구성원 목록 */
  @Get('families/:id/members')
  @Header('Cache-Control', 'no-store')
  listMembers(@Param('id', ParseIntPipe) id: number, @Query('userId', ParseIntPipe) userId: number) {
    return this.boardService.listMembers(id, userId);
  }

  /** 내가 속한 가족 목록 */
  @Get('families')
  @Header('Cache-Control', 'no-store')
  myFamilies(@Query('userId', ParseIntPipe) userId: number) {
    return this.boardService.myFamilies(userId);
  }

  /** 가족 게시판 글 목록 */
  @Get('posts')
  @Header('Cache-Control', 'no-store')
  listPosts(
    @Query('familyId', ParseIntPipe) familyId: number,
    @Query('userId', ParseIntPipe) userId: number,
  ) {
    return this.boardService.listPosts(familyId, userId);
  }

  @Post('posts')
  createPost(@Body(new ZodValidationPipe(createPostSchema)) data: CreatePostDto) {
    return this.boardService.createPost(data);
  }

  @Delete('posts/:id')
  deletePost(@Param('id', ParseIntPipe) id: number, @Query('userId', ParseIntPipe) userId: number) {
    return this.boardService.deletePost(id, userId);
  }

  /** 게시글 댓글 목록 */
  @Get('posts/:id/comments')
  @Header('Cache-Control', 'no-store')
  listComments(@Param('id', ParseIntPipe) id: number, @Query('userId', ParseIntPipe) userId: number) {
    return this.boardService.listComments(id, userId);
  }

  @Post('comments')
  createComment(@Body(new ZodValidationPipe(createCommentSchema)) data: CreateCommentDto) {
    return this.boardService.createComment(data);
  }

  @Delete('comments/:id')
  deleteComment(@Param('id', ParseIntPipe) id: number, @Query('userId', ParseIntPipe) userId: number) {
    return this.boardService.deleteComment(id, userId);
  }
}
