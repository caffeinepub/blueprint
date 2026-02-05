import { useState, useRef } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useCreateStepBasedBlueprint } from '../hooks/useQueries';
import { useActor } from '../hooks/useActor';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Loader2, 
  DollarSign, 
  Upload, 
  X, 
  Eye, 
  Plus,
  Trash2,
  Copy,
  Type,
  HelpCircle,
  ChevronDown,
  CheckSquare,
  Calendar,
  Edit2,
  ChevronRight,
  Palette,
  Image as ImageIcon,
  Tag
} from 'lucide-react';
import { toast } from 'sonner';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import OfflineModeNotice from './OfflineModeNotice';

type BlockType = 'text' | 'question' | 'dropdown' | 'checklist' | 'dailyStep';

interface BaseBlock {
  id: string;
  type: BlockType;
}

interface TextBlock extends BaseBlock {
  type: 'text';
  content: string;
}

interface QuestionBlock extends BaseBlock {
  type: 'question';
  question: string;
  placeholder: string;
}

interface DropdownBlock extends BaseBlock {
  type: 'dropdown';
  label: string;
  options: string[];
}

interface ChecklistBlock extends BaseBlock {
  type: 'checklist';
  title: string;
  items: string[];
}

interface DailyStepBlock extends BaseBlock {
  type: 'dailyStep';
  day: number;
  title: string;
  description: string;
}

type Block = TextBlock | QuestionBlock | DropdownBlock | ChecklistBlock | DailyStepBlock;

interface Step {
  id: string;
  name: string;
  blocks: Block[];
  isOpen: boolean;
}

interface ColorTheme {
  name: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
}

const predefinedThemes: ColorTheme[] = [
  { name: 'Ocean Blue', primaryColor: '#007AFF', secondaryColor: '#4A90E2', accentColor: '#376BB2' },
  { name: 'Forest Green', primaryColor: '#34C759', secondaryColor: '#52D376', accentColor: '#2A9D4A' },
  { name: 'Sunset Orange', primaryColor: '#FF9500', secondaryColor: '#FFB340', accentColor: '#CC7700' },
  { name: 'Royal Purple', primaryColor: '#AF52DE', secondaryColor: '#C77EE8', accentColor: '#8C42B8' },
  { name: 'Rose Pink', primaryColor: '#FF2D55', secondaryColor: '#FF5A7A', accentColor: '#CC2444' },
  { name: 'Slate Gray', primaryColor: '#8E8E93', secondaryColor: '#AEAEB2', accentColor: '#636366' },
];

export default function StepBasedBlueprintBuilder() {
  const navigate = useNavigate();
  const createBlueprint = useCreateStepBasedBlueprint();
  const { actor, isFetching: actorFetching } = useActor();

  const [currentStep, setCurrentStep] = useState<'build' | 'preview' | 'publish'>('build');
  const [steps, setSteps] = useState<Step[]>([]);
  const [draggedStepId, setDraggedStepId] = useState<string | null>(null);
  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null);
  const [dragOverStepId, setDragOverStepId] = useState<string | null>(null);
  const [dragOverBlockId, setDragOverBlockId] = useState<string | null>(null);
  const [editingStepId, setEditingStepId] = useState<string | null>(null);
  const [editingStepName, setEditingStepName] = useState<string>('');

  // Publish form state
  const [blueprintTitle, setBlueprintTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [priceType, setPriceType] = useState<'free' | 'paid'>('free');
  const [price, setPrice] = useState<string>('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tags state
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState<string>('');

  // Theme customization state
  const [selectedBannerImage, setSelectedBannerImage] = useState<File | null>(null);
  const [bannerImagePreview, setBannerImagePreview] = useState<string | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<ColorTheme>(predefinedThemes[0]);
  const [customPrimaryColor, setCustomPrimaryColor] = useState<string>('');
  const [customSecondaryColor, setCustomSecondaryColor] = useState<string>('');
  const [customAccentColor, setCustomAccentColor] = useState<string>('');
  const [useCustomTheme, setUseCustomTheme] = useState<boolean>(false);
  const bannerFileInputRef = useRef<HTMLInputElement>(null);

  const generateId = () => `id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const addStep = () => {
    const newStep: Step = {
      id: generateId(),
      name: `Step ${steps.length + 1}`,
      blocks: [],
      isOpen: true,
    };
    setSteps([...steps, newStep]);
    toast.success('Step added successfully');
  };

  const deleteStep = (stepId: string) => {
    setSteps(steps.filter(step => step.id !== stepId));
    toast.success('Step deleted');
  };

  const startEditingStepName = (stepId: string, currentName: string) => {
    setEditingStepId(stepId);
    setEditingStepName(currentName);
  };

  const saveStepName = (stepId: string) => {
    if (editingStepName.trim()) {
      setSteps(steps.map(step => 
        step.id === stepId ? { ...step, name: editingStepName.trim() } : step
      ));
      toast.success('Step name updated');
    }
    setEditingStepId(null);
    setEditingStepName('');
  };

  const toggleStepOpen = (stepId: string) => {
    setSteps(steps.map(step => 
      step.id === stepId ? { ...step, isOpen: !step.isOpen } : step
    ));
  };

  const addBlockToStep = (stepId: string, type: BlockType) => {
    const blockId = generateId();
    let newBlock: Block;

    switch (type) {
      case 'text':
        newBlock = { id: blockId, type: 'text', content: 'Enter your text here...' };
        break;
      case 'question':
        newBlock = { id: blockId, type: 'question', question: 'Your question?', placeholder: 'Answer here...' };
        break;
      case 'dropdown':
        newBlock = { id: blockId, type: 'dropdown', label: 'Select an option', options: ['Option 1', 'Option 2', 'Option 3'] };
        break;
      case 'checklist':
        newBlock = { id: blockId, type: 'checklist', title: 'Checklist', items: ['Task 1', 'Task 2', 'Task 3'] };
        break;
      case 'dailyStep':
        newBlock = { id: blockId, type: 'dailyStep', day: 1, title: 'Day Activity', description: 'Describe the daily activity...' };
        break;
    }

    setSteps(steps.map(step => 
      step.id === stepId ? { ...step, blocks: [...step.blocks, newBlock] } : step
    ));
    toast.success('Block added successfully');
  };

  const updateTextBlock = (stepId: string, blockId: string, content: string) => {
    setSteps(steps.map(step => 
      step.id === stepId ? {
        ...step,
        blocks: step.blocks.map(block => 
          block.id === blockId && block.type === 'text' ? { ...block, content } : block
        )
      } : step
    ));
  };

  const updateQuestionBlock = (stepId: string, blockId: string, updates: { question?: string; placeholder?: string }) => {
    setSteps(steps.map(step => 
      step.id === stepId ? {
        ...step,
        blocks: step.blocks.map(block => 
          block.id === blockId && block.type === 'question' ? { ...block, ...updates } : block
        )
      } : step
    ));
  };

  const updateDropdownBlock = (stepId: string, blockId: string, updates: { label?: string; options?: string[] }) => {
    setSteps(steps.map(step => 
      step.id === stepId ? {
        ...step,
        blocks: step.blocks.map(block => 
          block.id === blockId && block.type === 'dropdown' ? { ...block, ...updates } : block
        )
      } : step
    ));
  };

  const updateChecklistBlock = (stepId: string, blockId: string, updates: { title?: string; items?: string[] }) => {
    setSteps(steps.map(step => 
      step.id === stepId ? {
        ...step,
        blocks: step.blocks.map(block => 
          block.id === blockId && block.type === 'checklist' ? { ...block, ...updates } : block
        )
      } : step
    ));
  };

  const updateDailyStepBlock = (stepId: string, blockId: string, updates: { day?: number; title?: string; description?: string }) => {
    setSteps(steps.map(step => 
      step.id === stepId ? {
        ...step,
        blocks: step.blocks.map(block => 
          block.id === blockId && block.type === 'dailyStep' ? { ...block, ...updates } : block
        )
      } : step
    ));
  };

  const deleteBlock = (stepId: string, blockId: string) => {
    setSteps(steps.map(step => 
      step.id === stepId ? {
        ...step,
        blocks: step.blocks.filter(block => block.id !== blockId)
      } : step
    ));
    toast.success('Block deleted');
  };

  const duplicateBlock = (stepId: string, blockId: string) => {
    setSteps(steps.map(step => {
      if (step.id === stepId) {
        const blockToDuplicate = step.blocks.find(block => block.id === blockId);
        if (blockToDuplicate) {
          const newBlock = { ...blockToDuplicate, id: generateId() };
          const index = step.blocks.findIndex(block => block.id === blockId);
          const newBlocks = [...step.blocks];
          newBlocks.splice(index + 1, 0, newBlock);
          return { ...step, blocks: newBlocks };
        }
      }
      return step;
    }));
    toast.success('Block duplicated');
  };

  // Tag management functions
  const addTag = () => {
    const trimmedTag = tagInput.trim().toLowerCase();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput('');
      toast.success('Tag added');
    } else if (tags.includes(trimmedTag)) {
      toast.error('Tag already exists');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
    toast.success('Tag removed');
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  // Step drag handlers
  const handleStepDragStart = (e: React.DragEvent, stepId: string) => {
    setDraggedStepId(stepId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleStepDragOver = (e: React.DragEvent, stepId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedStepId && draggedStepId !== stepId) {
      setDragOverStepId(stepId);
    }
  };

  const handleStepDrop = (e: React.DragEvent, targetStepId: string) => {
    e.preventDefault();
    if (!draggedStepId || draggedStepId === targetStepId) {
      setDraggedStepId(null);
      setDragOverStepId(null);
      return;
    }

    const draggedIndex = steps.findIndex(s => s.id === draggedStepId);
    const targetIndex = steps.findIndex(s => s.id === targetStepId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newSteps = [...steps];
    const [draggedStep] = newSteps.splice(draggedIndex, 1);
    newSteps.splice(targetIndex, 0, draggedStep);

    setSteps(newSteps);
    setDraggedStepId(null);
    setDragOverStepId(null);
  };

  // Block drag handlers
  const handleBlockDragStart = (e: React.DragEvent, stepId: string, blockId: string) => {
    setDraggedBlockId(blockId);
    e.dataTransfer.effectAllowed = 'move';
    e.stopPropagation();
  };

  const handleBlockDragOver = (e: React.DragEvent, stepId: string, blockId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedBlockId && draggedBlockId !== blockId) {
      setDragOverBlockId(blockId);
    }
    e.stopPropagation();
  };

  const handleBlockDrop = (e: React.DragEvent, targetStepId: string, targetBlockId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!draggedBlockId || draggedBlockId === targetBlockId) {
      setDraggedBlockId(null);
      setDragOverBlockId(null);
      return;
    }

    // Find source step and block
    let sourceStepId: string | null = null;
    let sourceBlock: Block | null = null;
    
    for (const step of steps) {
      const block = step.blocks.find(b => b.id === draggedBlockId);
      if (block) {
        sourceStepId = step.id;
        sourceBlock = block;
        break;
      }
    }

    if (!sourceStepId || !sourceBlock) return;

    // Remove from source and add to target
    setSteps(steps.map(step => {
      if (step.id === sourceStepId) {
        return {
          ...step,
          blocks: step.blocks.filter(b => b.id !== draggedBlockId)
        };
      }
      if (step.id === targetStepId) {
        const targetIndex = step.blocks.findIndex(b => b.id === targetBlockId);
        const newBlocks = [...step.blocks];
        newBlocks.splice(targetIndex, 0, sourceBlock);
        return { ...step, blocks: newBlocks };
      }
      return step;
    }));

    setDraggedBlockId(null);
    setDragOverBlockId(null);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBannerImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedBannerImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setBannerImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      toast.success('Banner image uploaded');
    }
  };

  const getCurrentTheme = (): ColorTheme => {
    if (useCustomTheme && customPrimaryColor && customSecondaryColor && customAccentColor) {
      return {
        name: 'Custom',
        primaryColor: customPrimaryColor,
        secondaryColor: customSecondaryColor,
        accentColor: customAccentColor,
      };
    }
    return selectedTheme;
  };

  const isBackendReady = !!actor && !actorFetching;

  const handlePublish = async () => {
    if (!blueprintTitle.trim()) {
      toast.error('Please enter a blueprint title');
      return;
    }

    if (!description.trim()) {
      toast.error('Please enter a description');
      return;
    }

    if (steps.length === 0) {
      toast.error('Please add at least one step to your blueprint');
      return;
    }

    const hasBlocks = steps.some(step => step.blocks.length > 0);
    if (!hasBlocks) {
      toast.error('Please add at least one block to your blueprint');
      return;
    }

    if (priceType === 'paid') {
      const priceNum = parseFloat(price);
      if (isNaN(priceNum) || priceNum <= 0) {
        toast.error('Please enter a valid price');
        return;
      }
    }

    try {
      const priceInCents = priceType === 'free' ? BigInt(0) : BigInt(Math.round(parseFloat(price) * 100));
      const theme = getCurrentTheme();
      
      await createBlueprint.mutateAsync({
        title: blueprintTitle.trim(),
        description: description.trim(),
        steps,
        price: priceInCents,
        isFree: priceType === 'free',
        image: selectedImage || undefined,
        bannerImage: selectedBannerImage || undefined,
        theme,
        tags,
      });

      navigate({ to: '/marketplace' });
    } catch (error: any) {
      // Error handling is done in the mutation's onError
      console.error('Publish error:', error);
    }
  };

  const renderBlockEditor = (step: Step, block: Block) => {
    const isDragging = draggedBlockId === block.id;
    const isDragOver = dragOverBlockId === block.id;

    return (
      <div
        key={block.id}
        draggable
        onDragStart={(e) => handleBlockDragStart(e, step.id, block.id)}
        onDragOver={(e) => handleBlockDragOver(e, step.id, block.id)}
        onDrop={(e) => handleBlockDrop(e, step.id, block.id)}
        className={`group relative border rounded-lg p-4 bg-card transition-all ${
          isDragging ? 'opacity-50 scale-95' : ''
        } ${isDragOver ? 'border-primary border-2' : 'border-border'}`}
      >
        <div className="flex items-start gap-3">
          <div 
            className="cursor-grab active:cursor-grabbing pt-1 flex-shrink-0"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <img 
              src="/assets/generated/drag-handle-icon-transparent.dim_16x16.png" 
              alt="Drag" 
              className="h-5 w-5 opacity-50 hover:opacity-100 transition-opacity"
            />
          </div>

          <div className="flex-1 space-y-3">
            {block.type === 'text' && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Type className="h-4 w-4" />
                  Text Block
                </div>
                <Textarea
                  value={block.content}
                  onChange={(e) => updateTextBlock(step.id, block.id, e.target.value)}
                  placeholder="Enter your text content..."
                  className="min-h-[100px]"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}

            {block.type === 'question' && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <HelpCircle className="h-4 w-4" />
                  Question Block
                </div>
                <Input
                  value={block.question}
                  onChange={(e) => updateQuestionBlock(step.id, block.id, { question: e.target.value })}
                  placeholder="Enter your question..."
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                />
                <Input
                  value={block.placeholder}
                  onChange={(e) => updateQuestionBlock(step.id, block.id, { placeholder: e.target.value })}
                  placeholder="Placeholder text for answer..."
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}

            {block.type === 'dropdown' && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <ChevronDown className="h-4 w-4" />
                  Dropdown Block
                </div>
                <Input
                  value={block.label}
                  onChange={(e) => updateDropdownBlock(step.id, block.id, { label: e.target.value })}
                  placeholder="Dropdown label..."
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="space-y-2">
                  {block.options.map((option, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={option}
                        onChange={(e) => {
                          const newOptions = [...block.options];
                          newOptions[index] = e.target.value;
                          updateDropdownBlock(step.id, block.id, { options: newOptions });
                        }}
                        placeholder={`Option ${index + 1}`}
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          const newOptions = block.options.filter((_, i) => i !== index);
                          if (newOptions.length > 0) {
                            updateDropdownBlock(step.id, block.id, { options: newOptions });
                          }
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      updateDropdownBlock(step.id, block.id, { options: [...block.options, `Option ${block.options.length + 1}`] });
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Option
                  </Button>
                </div>
              </div>
            )}

            {block.type === 'checklist' && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <CheckSquare className="h-4 w-4" />
                  Checklist Block
                </div>
                <Input
                  value={block.title}
                  onChange={(e) => updateChecklistBlock(step.id, block.id, { title: e.target.value })}
                  placeholder="Checklist title..."
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="space-y-2">
                  {block.items.map((item, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={item}
                        onChange={(e) => {
                          const newItems = [...block.items];
                          newItems[index] = e.target.value;
                          updateChecklistBlock(step.id, block.id, { items: newItems });
                        }}
                        placeholder={`Item ${index + 1}`}
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          const newItems = block.items.filter((_, i) => i !== index);
                          if (newItems.length > 0) {
                            updateChecklistBlock(step.id, block.id, { items: newItems });
                          }
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      updateChecklistBlock(step.id, block.id, { items: [...block.items, `Item ${block.items.length + 1}`] });
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>
              </div>
            )}

            {block.type === 'dailyStep' && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  Daily Step Block
                </div>
                <div className="flex gap-2 items-center">
                  <Label className="whitespace-nowrap">Day:</Label>
                  <Input
                    type="number"
                    value={block.day}
                    onChange={(e) => updateDailyStepBlock(step.id, block.id, { day: parseInt(e.target.value) || 1 })}
                    min="1"
                    className="w-20"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                <Input
                  value={block.title}
                  onChange={(e) => updateDailyStepBlock(step.id, block.id, { title: e.target.value })}
                  placeholder="Activity title..."
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                />
                <Textarea
                  value={block.description}
                  onChange={(e) => updateDailyStepBlock(step.id, block.id, { description: e.target.value })}
                  placeholder="Describe the daily activity..."
                  className="min-h-[80px]"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}
          </div>

          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                duplicateBlock(step.id, block.id);
              }}
              title="Duplicate block"
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                deleteBlock(step.id, block.id);
              }}
              title="Delete block"
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const renderBlockPreview = (block: Block, theme: ColorTheme) => {
    return (
      <div key={block.id} className="border rounded-lg p-4 bg-card">
        {block.type === 'text' && (
          <p className="text-sm whitespace-pre-wrap">{block.content}</p>
        )}

        {block.type === 'question' && (
          <div className="space-y-2">
            <Label className="font-medium">{block.question}</Label>
            <Input placeholder={block.placeholder} disabled />
          </div>
        )}

        {block.type === 'dropdown' && (
          <div className="space-y-2">
            <Label className="font-medium">{block.label}</Label>
            <div className="border rounded-md p-2 bg-muted text-sm text-muted-foreground">
              {block.options[0] || 'Select an option...'}
            </div>
          </div>
        )}

        {block.type === 'checklist' && (
          <div className="space-y-2">
            <h4 className="font-medium">{block.title}</h4>
            <div className="space-y-1">
              {block.items.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="h-4 w-4 border rounded" />
                  <span className="text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {block.type === 'dailyStep' && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div 
                className="flex items-center justify-center w-8 h-8 rounded-full text-white font-semibold text-sm"
                style={{ backgroundColor: theme.primaryColor }}
              >
                {block.day}
              </div>
              <h4 className="font-medium">{block.title}</h4>
            </div>
            <p className="text-sm text-muted-foreground ml-10">{block.description}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-2">
        <div className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold ${currentStep === 'build' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
          1
        </div>
        <div className={`h-1 w-16 ${currentStep !== 'build' ? 'bg-primary' : 'bg-muted'}`} />
        <div className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold ${currentStep === 'preview' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
          2
        </div>
        <div className={`h-1 w-16 ${currentStep === 'publish' ? 'bg-primary' : 'bg-muted'}`} />
        <div className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold ${currentStep === 'publish' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
          3
        </div>
      </div>

      {/* Build Step */}
      {currentStep === 'build' && (
        <Card>
          <CardHeader>
            <CardTitle>Step 1: Build Your Blueprint</CardTitle>
            <CardDescription>
              Create steps and add content blocks to build your structured plan
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={addStep} className="w-full" size="lg">
              <img 
                src="/assets/generated/add-step-icon-transparent.dim_24x24.png" 
                alt="Add Step" 
                className="h-5 w-5 mr-2"
              />
              Add Step
            </Button>

            {steps.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No steps yet. Click "Add Step" to get started!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {steps.map((step) => {
                  const isDragging = draggedStepId === step.id;
                  const isDragOver = dragOverStepId === step.id;

                  return (
                    <div
                      key={step.id}
                      draggable
                      onDragStart={(e) => handleStepDragStart(e, step.id)}
                      onDragOver={(e) => handleStepDragOver(e, step.id)}
                      onDrop={(e) => handleStepDrop(e, step.id)}
                      className={`border rounded-lg bg-accent/30 transition-all ${
                        isDragging ? 'opacity-50 scale-95' : ''
                      } ${isDragOver ? 'border-primary border-2' : 'border-border'}`}
                    >
                      <Collapsible open={step.isOpen} onOpenChange={() => toggleStepOpen(step.id)}>
                        <div className="flex items-center gap-3 p-4 bg-accent/50">
                          <div 
                            className="cursor-grab active:cursor-grabbing flex-shrink-0"
                            onMouseDown={(e) => e.stopPropagation()}
                          >
                            <img 
                              src="/assets/generated/step-drag-handle-icon-transparent.dim_16x16.png" 
                              alt="Drag Step" 
                              className="h-5 w-5 opacity-50 hover:opacity-100 transition-opacity"
                            />
                          </div>

                          <img 
                            src="/assets/generated/step-header-icon-transparent.dim_24x24.png" 
                            alt="Step" 
                            className="h-6 w-6 flex-shrink-0"
                          />

                          {editingStepId === step.id ? (
                            <Input
                              value={editingStepName}
                              onChange={(e) => setEditingStepName(e.target.value)}
                              onBlur={() => saveStepName(step.id)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') saveStepName(step.id);
                                if (e.key === 'Escape') {
                                  setEditingStepId(null);
                                  setEditingStepName('');
                                }
                              }}
                              className="flex-1"
                              autoFocus
                              onMouseDown={(e) => e.stopPropagation()}
                              onClick={(e) => e.stopPropagation()}
                            />
                          ) : (
                            <h3 className="font-semibold text-lg flex-1">{step.name}</h3>
                          )}

                          <div className="flex gap-1 flex-shrink-0">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                startEditingStepName(step.id, step.name);
                              }}
                              title="Rename step"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteStep(step.id);
                              }}
                              title="Delete step"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                            <CollapsibleTrigger asChild>
                              <Button size="sm" variant="ghost">
                                <ChevronRight className={`h-4 w-4 transition-transform ${step.isOpen ? 'rotate-90' : ''}`} />
                              </Button>
                            </CollapsibleTrigger>
                          </div>
                        </div>

                        <CollapsibleContent>
                          <div className="p-4 space-y-3">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="w-full">
                                  <Plus className="h-4 w-4 mr-2" />
                                  Add Block to This Step
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="w-56">
                                <DropdownMenuItem onClick={() => addBlockToStep(step.id, 'text')}>
                                  <Type className="h-4 w-4 mr-2" />
                                  Text Block
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => addBlockToStep(step.id, 'question')}>
                                  <HelpCircle className="h-4 w-4 mr-2" />
                                  Question Block
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => addBlockToStep(step.id, 'dropdown')}>
                                  <ChevronDown className="h-4 w-4 mr-2" />
                                  Dropdown Block
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => addBlockToStep(step.id, 'checklist')}>
                                  <CheckSquare className="h-4 w-4 mr-2" />
                                  Checklist Block
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => addBlockToStep(step.id, 'dailyStep')}>
                                  <Calendar className="h-4 w-4 mr-2" />
                                  Daily Step Block
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>

                            {step.blocks.length === 0 ? (
                              <div className="text-center py-8 text-muted-foreground text-sm">
                                No blocks in this step. Add a block to get started!
                              </div>
                            ) : (
                              <div className="space-y-3">
                                {step.blocks.map(block => renderBlockEditor(step, block))}
                              </div>
                            )}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => setCurrentStep('preview')}
                disabled={steps.length === 0 || !steps.some(s => s.blocks.length > 0)}
                className="flex-1"
                size="lg"
              >
                Preview Blueprint
                <Eye className="h-5 w-5 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview Step */}
      {currentStep === 'preview' && (
        <Card>
          <CardHeader>
            <CardTitle>Step 2: Preview Your Blueprint</CardTitle>
            <CardDescription>
              Review how your step-based blueprint will appear with your selected theme
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Theme Preview Banner */}
            {bannerImagePreview && (
              <div className="w-full h-48 rounded-lg overflow-hidden">
                <img 
                  src={bannerImagePreview} 
                  alt="Blueprint Banner" 
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div 
              className="p-6 rounded-lg"
              style={{
                background: `linear-gradient(135deg, ${getCurrentTheme().primaryColor}15, ${getCurrentTheme().secondaryColor}15)`,
                borderLeft: `4px solid ${getCurrentTheme().primaryColor}`,
              }}
            >
              <h3 className="font-bold text-xl mb-4">Blueprint Preview</h3>
              <div className="space-y-6">
                {steps.map((step, stepIndex) => (
                  <div key={step.id} className="space-y-3">
                    <div className="flex items-center gap-3 pb-2 border-b">
                      <div 
                        className="flex items-center justify-center w-8 h-8 rounded-full text-white font-semibold text-sm"
                        style={{ backgroundColor: getCurrentTheme().primaryColor }}
                      >
                        {stepIndex + 1}
                      </div>
                      <h4 className="font-bold text-lg">{step.name}</h4>
                    </div>
                    <div className="space-y-3 ml-11">
                      {step.blocks.map(block => renderBlockPreview(block, getCurrentTheme()))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setCurrentStep('build')}
                className="flex-1"
              >
                Back to Edit
              </Button>
              <Button
                onClick={() => setCurrentStep('publish')}
                className="flex-1"
              >
                Continue to Publish
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Publish Step */}
      {currentStep === 'publish' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Step 3: Publish to Marketplace
            </CardTitle>
            <CardDescription>
              Add details, customize appearance, and set pricing to share your blueprint
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Offline Mode Notice */}
            {!isBackendReady && (
              <OfflineModeNotice />
            )}

            <div className="space-y-2">
              <Label htmlFor="title">Blueprint Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Learn Spanish in 90 Days"
                value={blueprintTitle}
                onChange={(e) => setBlueprintTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Blueprint Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe your blueprint and what makes it valuable... Share your experience, tips, and what users can expect from following this plan."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[120px]"
              />
              <p className="text-xs text-muted-foreground">Help others understand the value of your blueprint</p>
            </div>

            {/* Tags Section */}
            <div className="space-y-3">
              <Label htmlFor="tags" className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Tags
              </Label>
              <p className="text-xs text-muted-foreground">
                Add tags to help people discover your blueprint when searching
              </p>
              <div className="flex gap-2">
                <Input
                  id="tags"
                  placeholder="e.g., spanish, language, learning"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagInputKeyDown}
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={addTag}
                  variant="outline"
                  disabled={!tagInput.trim()}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-accent/30">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Blueprint Personalization Section */}
            <div className="space-y-4 p-4 border rounded-lg bg-accent/30">
              <div className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-lg">Personalize Your Blueprint</h3>
              </div>

              {/* Banner Image Upload */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Banner Image (Optional)
                </Label>
                {bannerImagePreview ? (
                  <div className="relative">
                    <img
                      src={bannerImagePreview}
                      alt="Banner Preview"
                      className="w-full h-40 object-cover rounded-lg"
                    />
                    <Button
                      size="sm"
                      variant="destructive"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setSelectedBannerImage(null);
                        setBannerImagePreview(null);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-32 border-dashed"
                    onClick={() => bannerFileInputRef.current?.click()}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Click to upload banner image</span>
                    </div>
                  </Button>
                )}
                <input
                  ref={bannerFileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleBannerImageSelect}
                />
              </div>

              {/* Color Theme Selection */}
              <div className="space-y-3">
                <Label>Color Theme</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {predefinedThemes.map((theme) => (
                    <button
                      key={theme.name}
                      onClick={() => {
                        setSelectedTheme(theme);
                        setUseCustomTheme(false);
                      }}
                      className={`p-3 border-2 rounded-lg transition-all hover:scale-105 ${
                        !useCustomTheme && selectedTheme.name === theme.name
                          ? 'border-primary ring-2 ring-primary/20'
                          : 'border-border'
                      }`}
                    >
                      <div className="flex gap-2 mb-2">
                        <div 
                          className="w-8 h-8 rounded"
                          style={{ backgroundColor: theme.primaryColor }}
                        />
                        <div 
                          className="w-8 h-8 rounded"
                          style={{ backgroundColor: theme.secondaryColor }}
                        />
                        <div 
                          className="w-8 h-8 rounded"
                          style={{ backgroundColor: theme.accentColor }}
                        />
                      </div>
                      <p className="text-sm font-medium">{theme.name}</p>
                    </button>
                  ))}
                </div>

                {/* Custom Theme Option */}
                <div className="pt-2">
                  <button
                    onClick={() => setUseCustomTheme(!useCustomTheme)}
                    className={`w-full p-3 border-2 rounded-lg transition-all ${
                      useCustomTheme
                        ? 'border-primary ring-2 ring-primary/20'
                        : 'border-border'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Palette className="h-5 w-5" />
                      <span className="font-medium">Custom Colors</span>
                    </div>
                  </button>

                  {useCustomTheme && (
                    <div className="mt-3 space-y-3 p-3 border rounded-lg bg-card">
                      <div className="space-y-2">
                        <Label htmlFor="primaryColor">Primary Color</Label>
                        <div className="flex gap-2">
                          <Input
                            id="primaryColor"
                            type="color"
                            value={customPrimaryColor || '#007AFF'}
                            onChange={(e) => setCustomPrimaryColor(e.target.value)}
                            className="w-20 h-10"
                          />
                          <Input
                            type="text"
                            value={customPrimaryColor || '#007AFF'}
                            onChange={(e) => setCustomPrimaryColor(e.target.value)}
                            placeholder="#007AFF"
                            className="flex-1"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="secondaryColor">Secondary Color</Label>
                        <div className="flex gap-2">
                          <Input
                            id="secondaryColor"
                            type="color"
                            value={customSecondaryColor || '#4A90E2'}
                            onChange={(e) => setCustomSecondaryColor(e.target.value)}
                            className="w-20 h-10"
                          />
                          <Input
                            type="text"
                            value={customSecondaryColor || '#4A90E2'}
                            onChange={(e) => setCustomSecondaryColor(e.target.value)}
                            placeholder="#4A90E2"
                            className="flex-1"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="accentColor">Accent Color</Label>
                        <div className="flex gap-2">
                          <Input
                            id="accentColor"
                            type="color"
                            value={customAccentColor || '#376BB2'}
                            onChange={(e) => setCustomAccentColor(e.target.value)}
                            className="w-20 h-10"
                          />
                          <Input
                            type="text"
                            value={customAccentColor || '#376BB2'}
                            onChange={(e) => setCustomAccentColor(e.target.value)}
                            placeholder="#376BB2"
                            className="flex-1"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Blueprint Image (Optional)</Label>
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-56 object-cover rounded-lg"
                  />
                  <Button
                    size="sm"
                    variant="destructive"
                    className="absolute top-2 right-2"
                    onClick={() => {
                      setSelectedImage(null);
                      setImagePreview(null);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-32 border-dashed"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Click to upload an image</span>
                  </div>
                </Button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageSelect}
              />
            </div>

            <div className="space-y-3">
              <Label>Pricing *</Label>
              <RadioGroup value={priceType} onValueChange={(value) => setPriceType(value as 'free' | 'paid')}>
                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer">
                  <RadioGroupItem value="free" id="free" />
                  <Label htmlFor="free" className="font-normal cursor-pointer flex-1">
                    <div>
                      <p className="font-medium">Free</p>
                      <p className="text-xs text-muted-foreground">Share your blueprint with the community at no cost</p>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer">
                  <RadioGroupItem value="paid" id="paid" />
                  <Label htmlFor="paid" className="font-normal cursor-pointer flex-1">
                    <div>
                      <p className="font-medium">Paid</p>
                      <p className="text-xs text-muted-foreground">Set a price and monetize your expertise</p>
                    </div>
                  </Label>
                </div>
              </RadioGroup>

              {priceType === 'paid' && (
                <div className="space-y-2 ml-6 mt-3">
                  <Label htmlFor="price">Price (USD)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="price"
                      type="number"
                      placeholder="9.99"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      min="0.01"
                      step="0.01"
                      className="pl-9"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setCurrentStep('preview')}
                className="flex-1"
              >
                Back to Preview
              </Button>
              <Button
                onClick={handlePublish}
                disabled={createBlueprint.isPending}
                className="flex-1 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                size="lg"
              >
                {createBlueprint.isPending ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    {isBackendReady ? 'Publishing...' : 'Saving...'}
                  </>
                ) : isBackendReady ? (
                  'Publish Blueprint'
                ) : (
                  'Save Locally'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
