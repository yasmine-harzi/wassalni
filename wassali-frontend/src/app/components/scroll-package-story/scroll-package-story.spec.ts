import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScrollPackageStoryComponent } from './scroll-package-story';

describe('ScrollPackageStory', () => {
  let component: ScrollPackageStoryComponent;
  let fixture: ComponentFixture<ScrollPackageStoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScrollPackageStoryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ScrollPackageStoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
