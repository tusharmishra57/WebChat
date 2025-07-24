/* 🎨 MODERN EMOJI PICKER JAVASCRIPT */

class ModernEmojiPicker {
    constructor() {
        this.isOpen = false;
        this.currentCategory = 'recent';
        this.recentEmojis = JSON.parse(localStorage.getItem('recent_emojis')) || [];
        this.searchTimeout = null;
        this.skinTone = localStorage.getItem('emoji_skin_tone') || 'default';
        
        // Comprehensive emoji database
        this.emojiData = {
            recent: [],
            smileys: [
                '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃',
                '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙',
                '🥲', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫',
                '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬',
                '🤥', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮',
                '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '🥸', '😎',
                '🤓', '🧐', '😕', '😟', '🙁', '😮', '😯', '😲', '😳', '🥺',
                '😦', '😧', '😨', '😰', '😥', '😢', '😭', '😱', '😖', '😣',
                '😞', '😓', '😩', '😫', '🥱', '😤', '😡', '😠', '🤬', '😈',
                '👿', '💀', '☠️', '💩', '🤡', '👹', '👺', '👻', '👽', '👾',
                '🤖', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾'
            ],
            animals: [
                '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐻‍❄️', '🐨',
                '🐯', '🦁', '🐮', '🐷', '🐽', '🐸', '🐵', '🙈', '🙉', '🙊',
                '🐒', '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦅', '🦉',
                '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞',
                '🐜', '🦟', '🦗', '🕷️', '🕸️', '🦂', '🐢', '🐍', '🦎', '🦖',
                '🦕', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬',
                '🐳', '🐋', '🦈', '🐊', '🐅', '🐆', '🦓', '🦍', '🦧', '🐘',
                '🦛', '🦏', '🐪', '🐫', '🦒', '🦘', '🐃', '🐂', '🐄', '🐎',
                '🐖', '🐏', '🐑', '🦙', '🐐', '🦌', '🐕', '🐩', '🦮', '🐕‍🦺',
                '🐈', '🐈‍⬛', '🐓', '🦃', '🦚', '🦜', '🦢', '🦩', '🕊️', '🐇'
            ],
            food: [
                '🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐',
                '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑',
                '🥦', '🥬', '🥒', '🌶️', '🫑', '🌽', '🥕', '🫒', '🧄', '🧅',
                '🥔', '🍠', '🥐', '🥯', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳',
                '🧈', '🥞', '🧇', '🥓', '🥩', '🍗', '🍖', '🦴', '🌭', '🍔',
                '🍟', '🍕', '🫓', '🥪', '🥙', '🧆', '🌮', '🌯', '🫔', '🥗',
                '🥘', '🫕', '🥫', '🍝', '🍜', '🍲', '🍛', '🍣', '🍱', '🥟',
                '🦪', '🍤', '🍙', '🍚', '🍘', '🍥', '🥠', '🥮', '🍢', '🍡',
                '🍧', '🍨', '🍦', '🥧', '🧁', '🎂', '🍰', '🧇', '🍪', '🍫',
                '🍬', '🍭', '🍮', '🍯', '🍼', '🥛', '☕', '🫖', '🍵', '🍶'
            ],
            activity: [
                '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱',
                '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳',
                '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛷', '⛸️',
                '🥌', '🎿', '⛷️', '🏂', '🪂', '🏋️‍♀️', '🏋️', '🏋️‍♂️', '🤼‍♀️', '🤼',
                '🤼‍♂️', '🤸‍♀️', '🤸', '🤸‍♂️', '⛹️‍♀️', '⛹️', '⛹️‍♂️', '🤺', '🤾‍♀️', '🤾',
                '🤾‍♂️', '🏌️‍♀️', '🏌️', '🏌️‍♂️', '🏇', '🧘‍♀️', '🧘', '🧘‍♂️', '🏄‍♀️', '🏄',
                '🏄‍♂️', '🏊‍♀️', '🏊', '🏊‍♂️', '🤽‍♀️', '🤽', '🤽‍♂️', '🚣‍♀️', '🚣', '🚣‍♂️',
                '🧗‍♀️', '🧗', '🧗‍♂️', '🚵‍♀️', '🚵', '🚵‍♂️', '🚴‍♀️', '🚴', '🚴‍♂️', '🏆',
                '🥇', '🥈', '🥉', '🏅', '🎖️', '🏵️', '🎗️', '🎫', '🎟️', '🎪'
            ],
            travel: [
                '🌍', '🌎', '🌏', '🌐', '🗺️', '🗾', '🧭', '🏔️', '⛰️', '🌋',
                '🗻', '🏕️', '🏖️', '🏜️', '🏝️', '🏞️', '🏟️', '🏛️', '🏗️', '🧱',
                '🪨', '🪵', '🛖', '🏘️', '🏚️', '🏠', '🏡', '🏢', '🏣', '🏤',
                '🏥', '🏦', '🏨', '🏩', '🏪', '🏫', '🏬', '🏭', '🏯', '🏰',
                '💒', '🗼', '🗽', '⛪', '🕌', '🛕', '🕍', '⛩️', '🕋', '⛲',
                '⛺', '🌁', '🌃', '🏙️', '🌄', '🌅', '🌆', '🌇', '🌉', '♨️',
                '🎠', '🎡', '🎢', '💈', '🎪', '🚂', '🚃', '🚄', '🚅', '🚆',
                '🚇', '🚈', '🚉', '🚊', '🚝', '🚞', '🚋', '🚌', '🚍', '🚎',
                '🚐', '🚑', '🚒', '🚓', '🚔', '🚕', '🚖', '🚗', '🚘', '🚙'
            ],
            objects: [
                '⌚', '📱', '📲', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '🖲️', '🕹️',
                '🗜️', '💽', '💾', '💿', '📀', '📼', '📷', '📸', '📹', '🎥',
                '📽️', '🎞️', '📞', '☎️', '📟', '📠', '📺', '📻', '🎙️', '🎚️',
                '🎛️', '🧭', '⏱️', '⏲️', '⏰', '🕰️', '⌛', '⏳', '📡', '🔋',
                '🔌', '💡', '🔦', '🕯️', '🪔', '🧯', '🛢️', '💸', '💵', '💴',
                '💶', '💷', '💰', '💳', '💎', '⚖️', '🧰', '🔧', '🔨', '⚒️',
                '🛠️', '⛏️', '🔩', '⚙️', '🧱', '⛓️', '🧲', '🔫', '💣', '🧨',
                '🪓', '🔪', '🗡️', '⚔️', '🛡️', '🚬', '⚰️', '🪦', '⚱️', '🏺'
            ],
            symbols: [
                '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
                '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️',
                '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐',
                '⛎', '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐',
                '♑', '♒', '♓', '🆔', '⚛️', '🉑', '☢️', '☣️', '📴', '📳',
                '🈶', '🈚', '🈸', '🈺', '🈷️', '✴️', '🆚', '💮', '🉐', '㊙️',
                '㊗️', '🈴', '🈵', '🈹', '🈲', '🅰️', '🅱️', '🆎', '🆑', '🅾️',
                '🆘', '❌', '⭕', '🛑', '⛔', '📛', '🚫', '💯', '💢', '♨️',
                '🚷', '🚯', '🚱', '🚳', '🚭', '🔞', '📵', '🚯', '❗', '❕'
            ]
        };
        
        // Comprehensive emoji keywords for search
        this.emojiKeywords = {
            // Smileys & Emotions
            '😀': ['grin', 'happy', 'smile', 'joy', 'cheerful'],
            '😃': ['happy', 'joy', 'smile', 'grin', 'excited'],
            '😄': ['happy', 'joy', 'laugh', 'smile', 'cheerful'],
            '😁': ['grin', 'happy', 'smile', 'cheerful'],
            '😆': ['laugh', 'happy', 'joy', 'lol'],
            '😅': ['laugh', 'sweat', 'smile', 'nervous'],
            '🤣': ['laugh', 'rofl', 'funny', 'lol', 'rolling'],
            '😂': ['laugh', 'cry', 'funny', 'tears', 'lol'],
            '😊': ['smile', 'happy', 'blush', 'pleased'],
            '😇': ['angel', 'innocent', 'halo', 'good'],
            '🥰': ['love', 'heart', 'smile', 'adore'],
            '😍': ['love', 'heart', 'eyes', 'crush'],
            '🤩': ['star', 'eyes', 'excited', 'amazing'],
            '😘': ['kiss', 'love', 'heart', 'blow'],
            '😗': ['kiss', 'whistle', 'pucker'],
            '😚': ['kiss', 'closed', 'eyes'],
            '😙': ['kiss', 'smile'],
            '😋': ['yum', 'tongue', 'delicious', 'tasty'],
            '😛': ['tongue', 'playful', 'tease'],
            '😜': ['wink', 'tongue', 'playful', 'silly'],
            '🤪': ['crazy', 'zany', 'wild', 'funny'],
            '😝': ['tongue', 'closed', 'eyes', 'silly'],
            '🤑': ['money', 'rich', 'dollar', 'greed'],
            '🤗': ['hug', 'embrace', 'friendly'],
            '🤭': ['giggle', 'secret', 'oops'],
            '🤫': ['shush', 'quiet', 'secret', 'silence'],
            '🤔': ['think', 'hmm', 'consider', 'ponder'],
            '😐': ['neutral', 'meh', 'expressionless'],
            '😑': ['expressionless', 'blank', 'meh'],
            '😶': ['no', 'mouth', 'quiet', 'silence'],
            '😏': ['smirk', 'sly', 'suggestive'],
            '😒': ['unamused', 'annoyed', 'meh'],
            '🙄': ['eye', 'roll', 'annoyed', 'whatever'],
            '😬': ['grimace', 'awkward', 'nervous'],
            '😔': ['sad', 'disappointed', 'down'],
            '😪': ['sleepy', 'tired', 'snot'],
            '🤤': ['drool', 'sleep', 'desire'],
            '😴': ['sleep', 'zzz', 'tired'],
            '😷': ['mask', 'sick', 'doctor', 'covid'],
            '🤒': ['sick', 'thermometer', 'fever', 'ill'],
            '🤕': ['hurt', 'bandage', 'injured'],
            '🤢': ['sick', 'nausea', 'vomit', 'green'],
            '🤮': ['vomit', 'sick', 'puke'],
            '🤧': ['sneeze', 'sick', 'tissue'],
            '🥵': ['hot', 'sweating', 'heat'],
            '🥶': ['cold', 'freezing', 'blue'],
            '🥴': ['dizzy', 'drunk', 'woozy'],
            '😵': ['dizzy', 'dead', 'knockout'],
            '🤯': ['mind', 'blown', 'explode'],
            '🤠': ['cowboy', 'hat', 'western'],
            '🥳': ['party', 'celebration', 'birthday'],
            '😎': ['cool', 'sunglasses', 'awesome'],
            '🤓': ['nerd', 'geek', 'smart', 'glasses'],
            '🧐': ['monocle', 'thinking', 'fancy'],
            '😕': ['confused', 'worried', 'frown'],
            '😟': ['worried', 'concerned', 'frown'],
            '🙁': ['frown', 'sad', 'disappointed'],
            '😮': ['surprised', 'shock', 'wow'],
            '😯': ['surprised', 'hushed'],
            '😲': ['shocked', 'amazed', 'gasp'],
            '😳': ['flushed', 'embarrassed', 'shy'],
            '🥺': ['pleading', 'puppy', 'eyes', 'cute'],
            '😦': ['frown', 'surprised', 'disappointed'],
            '😧': ['anguished', 'worried', 'scared'],
            '😨': ['fearful', 'scared', 'worried'],
            '😰': ['anxious', 'worried', 'nervous'],
            '😥': ['sad', 'worried', 'disappointed'],
            '😢': ['cry', 'sad', 'tear', 'upset'],
            '😭': ['cry', 'sob', 'tears', 'bawl'],
            '😱': ['scream', 'scared', 'shock', 'fear'],
            '😖': ['confounded', 'frustrated', 'upset'],
            '😣': ['persevere', 'struggle', 'effort'],
            '😞': ['disappointed', 'sad', 'upset'],
            '😓': ['sweat', 'hard', 'work', 'tired'],
            '😩': ['weary', 'tired', 'frustrated'],
            '😫': ['tired', 'upset', 'frustrated'],
            '🥱': ['yawn', 'tired', 'bored', 'sleepy'],
            '😤': ['huff', 'angry', 'steam', 'triumph'],
            '😡': ['angry', 'mad', 'rage', 'red'],
            '😠': ['angry', 'mad', 'annoyed'],
            '🤬': ['swear', 'curse', 'angry', 'symbols'],
            '😈': ['devil', 'evil', 'horns', 'mischief'],
            '👿': ['devil', 'angry', 'evil', 'imp'],
            '💀': ['skull', 'death', 'dead', 'danger'],
            '☠️': ['skull', 'bones', 'death', 'poison'],
            '💩': ['poop', 'shit', 'crap', 'pile'],
            '🤡': ['clown', 'joke', 'circus'],
            '👹': ['ogre', 'monster', 'red', 'japanese'],
            '👺': ['goblin', 'monster', 'red', 'japanese'],
            '👻': ['ghost', 'boo', 'spirit', 'halloween'],
            '👽': ['alien', 'ufo', 'extraterrestrial'],
            '👾': ['alien', 'monster', 'game', 'invader'],
            '🤖': ['robot', 'android', 'bot', 'ai'],
            
            // Hearts & Love
            '❤️': ['love', 'heart', 'red', 'romance'],
            '🧡': ['orange', 'heart', 'love'],
            '💛': ['yellow', 'heart', 'love', 'friendship'],
            '💚': ['green', 'heart', 'love', 'nature'],
            '💙': ['blue', 'heart', 'love', 'trust'],
            '💜': ['purple', 'heart', 'love'],
            '🖤': ['black', 'heart', 'love', 'dark'],
            '🤍': ['white', 'heart', 'love', 'pure'],
            '🤎': ['brown', 'heart', 'love'],
            '💔': ['broken', 'heart', 'sad', 'breakup'],
            '❣️': ['heart', 'exclamation', 'love'],
            '💕': ['two', 'hearts', 'love', 'affection'],
            '💞': ['revolving', 'hearts', 'love'],
            '💓': ['beating', 'heart', 'love', 'pulse'],
            '💗': ['growing', 'heart', 'love'],
            '💖': ['sparkling', 'heart', 'love'],
            '💘': ['heart', 'arrow', 'cupid', 'love'],
            '💝': ['heart', 'box', 'gift', 'love'],
            
            // Popular expressions
            '🔥': ['fire', 'hot', 'flame', 'lit'],
            '💯': ['hundred', 'perfect', 'score', 'full'],
            '👍': ['thumbs', 'up', 'good', 'yes', 'like'],
            '👎': ['thumbs', 'down', 'bad', 'no', 'dislike'],
            '✨': ['sparkles', 'stars', 'magic', 'shine'],
            '⭐': ['star', 'favorite', 'awesome'],
            '🌟': ['star', 'glowing', 'special'],
            '💫': ['dizzy', 'star', 'sparkle'],
            '🎉': ['party', 'celebration', 'confetti', 'tada'],
            '🎊': ['party', 'celebration', 'confetti'],
            '🥳': ['party', 'birthday', 'celebration'],
            '🎈': ['balloon', 'party', 'celebration'],
            '🎁': ['gift', 'present', 'box', 'surprise'],
            '🎀': ['ribbon', 'bow', 'gift', 'decoration'],
            
            // Common gestures
            '👋': ['wave', 'hello', 'goodbye', 'hi'],
            '🤚': ['raised', 'hand', 'stop', 'high', 'five'],
            '🖐️': ['hand', 'fingers', 'palm'],
            '✋': ['hand', 'stop', 'high', 'five'],
            '🖖': ['vulcan', 'spock', 'star', 'trek'],
            '👌': ['ok', 'good', 'perfect', 'circle'],
            '🤏': ['pinch', 'small', 'tiny'],
            '✌️': ['peace', 'victory', 'two'],
            '🤞': ['fingers', 'crossed', 'luck', 'hope'],
            '🤟': ['love', 'you', 'hand'],
            '🤘': ['rock', 'on', 'metal', 'horns'],
            '🤙': ['call', 'me', 'hand', 'hang', 'loose'],
            '👈': ['point', 'left', 'finger'],
            '👉': ['point', 'right', 'finger'],
            '👆': ['point', 'up', 'finger'],
            '🖕': ['middle', 'finger', 'rude'],
            '👇': ['point', 'down', 'finger'],
            '☝️': ['point', 'up', 'index'],
            '👏': ['clap', 'applause', 'congratulations'],
            '🙌': ['hands', 'up', 'celebration', 'praise'],
            '👐': ['open', 'hands', 'hug'],
            '🤲': ['palms', 'up', 'prayer', 'cupped'],
            '🤝': ['handshake', 'deal', 'agreement'],
            '🙏': ['pray', 'thanks', 'please', 'namaste'],
            
            // Common animals
            '🐶': ['dog', 'puppy', 'pet', 'cute'],
            '🐱': ['cat', 'kitten', 'pet', 'cute'],
            '🐭': ['mouse', 'rat', 'small'],
            '🐹': ['hamster', 'pet', 'cute'],
            '🐰': ['rabbit', 'bunny', 'easter', 'cute'],
            '🦊': ['fox', 'clever', 'orange'],
            '🐻': ['bear', 'teddy', 'cute'],
            '🐼': ['panda', 'bear', 'china', 'cute'],
            '🐨': ['koala', 'australia', 'cute'],
            '🐯': ['tiger', 'face', 'cat'],
            '🦁': ['lion', 'king', 'mane'],
            '🐮': ['cow', 'face', 'moo'],
            '🐷': ['pig', 'face', 'oink'],
            '🐵': ['monkey', 'face', 'see', 'no', 'evil'],
            '🙈': ['see', 'no', 'evil', 'monkey'],
            '🙉': ['hear', 'no', 'evil', 'monkey'],
            '🙊': ['speak', 'no', 'evil', 'monkey'],
            
            // Food
            '🍎': ['apple', 'fruit', 'red', 'healthy'],
            '🍊': ['orange', 'fruit', 'citrus'],
            '🍌': ['banana', 'fruit', 'yellow'],
            '🍇': ['grapes', 'fruit', 'wine'],
            '🍓': ['strawberry', 'fruit', 'red', 'berry'],
            '🍑': ['peach', 'fruit', 'butt'],
            '🍒': ['cherry', 'fruit', 'red'],
            '🥝': ['kiwi', 'fruit', 'green'],
            '🍅': ['tomato', 'fruit', 'red'],
            '🥑': ['avocado', 'fruit', 'green', 'healthy'],
            '🍆': ['eggplant', 'vegetable', 'purple'],
            '🥒': ['cucumber', 'vegetable', 'green'],
            '🌽': ['corn', 'vegetable', 'yellow'],
            '🥕': ['carrot', 'vegetable', 'orange'],
            '🍞': ['bread', 'loaf', 'food'],
            '🥖': ['baguette', 'bread', 'french'],
            '🧀': ['cheese', 'dairy', 'yellow'],
            '🥚': ['egg', 'food', 'protein'],
            '🍳': ['cooking', 'egg', 'fried'],
            '🥓': ['bacon', 'meat', 'breakfast'],
            '🍔': ['burger', 'hamburger', 'fast', 'food'],
            '🍟': ['fries', 'chips', 'fast', 'food'],
            '🍕': ['pizza', 'slice', 'italian'],
            '🌭': ['hot', 'dog', 'sausage'],
            '🥪': ['sandwich', 'bread', 'food'],
            '🌮': ['taco', 'mexican', 'food'],
            '🌯': ['burrito', 'wrap', 'mexican'],
            '🍝': ['pasta', 'spaghetti', 'italian'],
            '🍜': ['ramen', 'noodles', 'soup'],
            '🍲': ['stew', 'pot', 'soup'],
            '🍛': ['curry', 'rice', 'indian'],
            '🍣': ['sushi', 'japanese', 'fish'],
            '🍱': ['bento', 'box', 'japanese'],
            '🍘': ['rice', 'cracker', 'japanese'],
            '🍙': ['rice', 'ball', 'japanese'],
            '🍚': ['cooked', 'rice', 'white'],
            '🍧': ['shaved', 'ice', 'dessert'],
            '🍨': ['ice', 'cream', 'dessert'],
            '🍦': ['soft', 'ice', 'cream'],
            '🥧': ['pie', 'dessert', 'slice'],
            '🧁': ['cupcake', 'dessert', 'sweet'],
            '🎂': ['birthday', 'cake', 'celebration'],
            '🍰': ['cake', 'slice', 'dessert'],
            '🍪': ['cookie', 'dessert', 'sweet'],
            '🍫': ['chocolate', 'bar', 'sweet'],
            '🍬': ['candy', 'sweet', 'lolly'],
            '🍭': ['lollipop', 'candy', 'sweet'],
            '🍯': ['honey', 'pot', 'sweet'],
            
            // Drinks
            '☕': ['coffee', 'hot', 'drink', 'caffeine'],
            '🍵': ['tea', 'hot', 'drink', 'green'],
            '🧃': ['juice', 'box', 'drink'],
            '🥤': ['cup', 'straw', 'drink'],
            '🧋': ['bubble', 'tea', 'boba'],
            '🍺': ['beer', 'drink', 'alcohol'],
            '🍻': ['cheers', 'beer', 'party'],
            '🥂': ['champagne', 'cheers', 'celebration'],
            '🍷': ['wine', 'glass', 'alcohol'],
            '🥃': ['whiskey', 'glass', 'alcohol'],
            '🍸': ['cocktail', 'drink', 'party'],
            '🍹': ['tropical', 'drink', 'cocktail'],
            '🧊': ['ice', 'cube', 'cold'],
            
            // Activities & Sports
            '⚽': ['soccer', 'football', 'ball', 'sport'],
            '🏀': ['basketball', 'ball', 'sport'],
            '🏈': ['american', 'football', 'ball', 'sport'],
            '⚾': ['baseball', 'ball', 'sport'],
            '🎾': ['tennis', 'ball', 'sport'],
            '🏐': ['volleyball', 'ball', 'sport'],
            '🏉': ['rugby', 'ball', 'sport'],
            '🎱': ['8', 'ball', 'pool', 'billiards'],
            '🏓': ['ping', 'pong', 'table', 'tennis'],
            '🏸': ['badminton', 'racquet', 'sport'],
            '🥅': ['goal', 'net', 'sport'],
            '🎯': ['target', 'bullseye', 'dart'],
            '🏹': ['bow', 'arrow', 'archery'],
            '🎣': ['fishing', 'pole', 'fish'],
            '🏆': ['trophy', 'award', 'winner'],
            '🥇': ['first', 'place', 'gold', 'medal'],
            '🥈': ['second', 'place', 'silver', 'medal'],
            '🥉': ['third', 'place', 'bronze', 'medal'],
            '🏅': ['medal', 'award', 'sports'],
            
            // Travel & Places
            '🌍': ['earth', 'africa', 'europe', 'world'],
            '🌎': ['earth', 'americas', 'world'],
            '🌏': ['earth', 'asia', 'australia', 'world'],
            '🌐': ['globe', 'world', 'internet'],
            '🗺️': ['world', 'map', 'travel'],
            '🏔️': ['mountain', 'snow', 'peak'],
            '⛰️': ['mountain', 'peak', 'nature'],
            '🌋': ['volcano', 'eruption', 'lava'],
            '🏖️': ['beach', 'sand', 'vacation'],
            '🏝️': ['island', 'tropical', 'vacation'],
            '🏞️': ['national', 'park', 'nature'],
            '🏟️': ['stadium', 'sports', 'arena'],
            '🏛️': ['classical', 'building', 'museum'],
            '🏠': ['house', 'home', 'building'],
            '🏡': ['house', 'garden', 'home'],
            '🏢': ['office', 'building', 'work'],
            '🏣': ['japanese', 'office', 'building'],
            '🏤': ['post', 'office', 'european'],
            '🏥': ['hospital', 'medical', 'cross'],
            '🏦': ['bank', 'money', 'building'],
            '🏨': ['hotel', 'building', 'vacation'],
            '🏩': ['love', 'hotel', 'heart'],
            '🏪': ['convenience', 'store', '24', 'hour'],
            '🏫': ['school', 'building', 'education'],
            '🏬': ['department', 'store', 'shopping'],
            '🏭': ['factory', 'industry', 'pollution'],
            '🏯': ['japanese', 'castle', 'historic'],
            '🏰': ['castle', 'european', 'fairy', 'tale'],
            '💒': ['wedding', 'chapel', 'heart'],
            '🗼': ['tokyo', 'tower', 'landmark'],
            '🗽': ['statue', 'liberty', 'new', 'york'],
            '⛪': ['church', 'christian', 'religion'],
            '🕌': ['mosque', 'islam', 'religion'],
            '🛕': ['hindu', 'temple', 'religion'],
            '🕍': ['synagogue', 'jewish', 'religion'],
            '⛩️': ['shinto', 'shrine', 'japanese'],
            
            // Technology & Objects
            '📱': ['mobile', 'phone', 'cell', 'smartphone'],
            '📞': ['telephone', 'phone', 'call'],
            '☎️': ['telephone', 'phone', 'vintage'],
            '📟': ['pager', 'vintage', 'communication'],
            '📠': ['fax', 'machine', 'office'],
            '📺': ['television', 'tv', 'screen'],
            '📻': ['radio', 'music', 'vintage'],
            '💻': ['laptop', 'computer', 'pc'],
            '🖥️': ['desktop', 'computer', 'monitor'],
            '⌨️': ['keyboard', 'typing', 'computer'],
            '🖱️': ['computer', 'mouse', 'click'],
            '💾': ['floppy', 'disk', 'save', 'vintage'],
            '💿': ['cd', 'compact', 'disk'],
            '📀': ['dvd', 'disk', 'movie'],
            '🔋': ['battery', 'power', 'energy'],
            '🔌': ['electric', 'plug', 'power'],
            '💡': ['light', 'bulb', 'idea', 'bright'],
            '🔦': ['flashlight', 'torch', 'light'],
            '🕯️': ['candle', 'light', 'flame'],
            '🧯': ['fire', 'extinguisher', 'safety'],
            
            // Symbols & Flags
            '✅': ['check', 'mark', 'yes', 'correct'],
            '❌': ['cross', 'mark', 'no', 'wrong'],
            '❗': ['exclamation', 'mark', 'warning'],
            '❓': ['question', 'mark', 'ask'],
            '⭕': ['circle', 'correct', 'yes'],
            '🔴': ['red', 'circle', 'stop'],
            '🟡': ['yellow', 'circle', 'caution'],
            '🟢': ['green', 'circle', 'go'],
            '🔵': ['blue', 'circle'],
            '🟣': ['purple', 'circle'],
            '🟤': ['brown', 'circle'],
            '⚫': ['black', 'circle'],
            '⚪': ['white', 'circle'],
            '🟠': ['orange', 'circle'],
            '💯': ['hundred', 'percent', 'perfect'],
            '🔞': ['no', 'one', 'under', 'eighteen'],
            '📵': ['no', 'mobile', 'phones'],
            '🚫': ['prohibited', 'forbidden', 'not', 'allowed'],
        };
        
        this.initialize();
    }
    
    initialize() {
        this.setupEventListeners();
        this.loadRecentEmojis();
        this.updateCategoryName();
    }
    
    setupEventListeners() {
        // Toggle button
        const emojiBtn = document.getElementById('emoji-btn');
        if (emojiBtn) {
            emojiBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggle();
            });
        }
        
        // Close button
        const closeBtn = document.getElementById('close-emoji-picker');
        if (closeBtn) {
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.hide();
            });
        }
        
        // Search input
        const searchInput = document.getElementById('emoji-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.handleSearch(e.target.value);
            });
            
            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    this.clearSearch();
                }
            });
        }
        
        // Clear search button
        const clearBtn = document.getElementById('clear-search');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.clearSearch();
            });
        }
        
        // Category buttons
        const categoryBtns = document.querySelectorAll('.emoji-category');
        categoryBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const category = btn.dataset.category;
                this.switchCategory(category);
            });
        });
        
        // Close on outside click
        document.addEventListener('click', (e) => {
            const picker = document.getElementById('emoji-picker');
            if (this.isOpen && picker && !picker.contains(e.target)) {
                this.hide();
            }
        });
        
        // Prevent picker from closing when clicking inside
        const picker = document.getElementById('emoji-picker');
        if (picker) {
            picker.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }
    }
    
    toggle() {
        if (this.isOpen) {
            this.hide();
        } else {
            this.show();
        }
    }
    
    show() {
        const picker = document.getElementById('emoji-picker');
        const btn = document.getElementById('emoji-btn');
        
        if (picker && btn) {
            picker.classList.remove('hidden');
            picker.classList.add('show');
            btn.classList.add('active');
            this.isOpen = true;
            
            // Focus search input
            const searchInput = document.getElementById('emoji-search');
            if (searchInput) {
                setTimeout(() => searchInput.focus(), 100);
            }
            
            // Load current category
            this.loadCategory(this.currentCategory);
        }
    }
    
    hide() {
        const picker = document.getElementById('emoji-picker');
        const btn = document.getElementById('emoji-btn');
        
        if (picker && btn) {
            picker.classList.add('hidden');
            picker.classList.remove('show');
            btn.classList.remove('active');
            this.isOpen = false;
            
            // Clear search
            this.clearSearch();
        }
    }
    
    handleSearch(query) {
        clearTimeout(this.searchTimeout);
        
        const searchResults = document.getElementById('search-results');
        const categoryContent = document.getElementById('category-content');
        const noResults = document.getElementById('no-results');
        const clearBtn = document.getElementById('clear-search');
        
        if (query.trim() === '') {
            this.clearSearch();
            return;
        }
        
        // Show clear button
        if (clearBtn) {
            clearBtn.classList.remove('hidden');
        }
        
        this.searchTimeout = setTimeout(() => {
            const results = this.searchEmojis(query);
            
            if (results.length > 0) {
                this.displaySearchResults(results);
                if (searchResults) searchResults.classList.remove('hidden');
                if (categoryContent) categoryContent.classList.add('hidden');
                if (noResults) noResults.classList.add('hidden');
            } else {
                if (searchResults) searchResults.classList.add('hidden');
                if (categoryContent) categoryContent.classList.add('hidden');
                if (noResults) noResults.classList.remove('hidden');
            }
        }, 300);
    }
    
    searchEmojis(query) {
        const results = [];
        const searchTerm = query.toLowerCase().trim();
        
        // Search through all categories
        Object.values(this.emojiData).flat().forEach(emoji => {
            if (emoji === '') return;
            
            // Check keywords
            const keywords = this.emojiKeywords[emoji] || [];
            const hasKeywordMatch = keywords.some(keyword => 
                keyword.includes(searchTerm) || searchTerm.includes(keyword)
            );
            
            if (hasKeywordMatch) {
                results.push(emoji);
            }
        });
        
        // Remove duplicates and limit results
        return Array.from(new Set(results)).slice(0, 50);
    }
    
    displaySearchResults(emojis) {
        const grid = document.getElementById('search-grid');
        const resultsCount = document.getElementById('results-count');
        
        if (!grid) return;
        
        // Update results count
        if (resultsCount) {
            resultsCount.textContent = `${emojis.length} result${emojis.length !== 1 ? 's' : ''}`;
        }
        
        // Clear and populate grid
        grid.innerHTML = '';
        emojis.forEach(emoji => {
            const button = this.createEmojiButton(emoji);
            grid.appendChild(button);
        });
    }
    
    clearSearch() {
        const searchInput = document.getElementById('emoji-search');
        const clearBtn = document.getElementById('clear-search');
        const searchResults = document.getElementById('search-results');
        const categoryContent = document.getElementById('category-content');
        const noResults = document.getElementById('no-results');
        
        if (searchInput) searchInput.value = '';
        if (clearBtn) clearBtn.classList.add('hidden');
        if (searchResults) searchResults.classList.add('hidden');
        if (categoryContent) categoryContent.classList.remove('hidden');
        if (noResults) noResults.classList.add('hidden');
        
        clearTimeout(this.searchTimeout);
    }
    
    switchCategory(category) {
        // Update active category button
        document.querySelectorAll('.emoji-category').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const activeBtn = document.querySelector(`[data-category="${category}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }
        
        this.currentCategory = category;
        this.updateCategoryName();
        this.loadCategory(category);
        this.clearSearch();
    }
    
    updateCategoryName() {
        const categoryNames = {
            recent: 'Recently Used',
            smileys: 'Smileys & People',
            animals: 'Animals & Nature',
            food: 'Food & Drink',
            activity: 'Activity & Sports',
            travel: 'Travel & Places',
            objects: 'Objects',
            symbols: 'Symbols & Flags'
        };
        
        const subtitle = document.getElementById('category-name');
        if (subtitle) {
            subtitle.textContent = categoryNames[this.currentCategory] || 'Emojis';
        }
    }
    
    loadCategory(category) {
        const grid = document.getElementById('emoji-grid');
        if (!grid) return;
        
        let emojis = [];
        
        if (category === 'recent') {
            emojis = this.recentEmojis;
        } else {
            emojis = this.emojiData[category] || [];
        }
        
        // Clear and populate grid
        grid.innerHTML = '';
        
        if (emojis.length === 0 && category === 'recent') {
            grid.innerHTML = `
                <div class="no-recent-emojis">
                    <div class="no-recent-icon">🕒</div>
                    <div class="no-recent-text">No recent emojis</div>
                    <div class="no-recent-subtitle">Your recently used emojis will appear here</div>
                </div>
            `;
            return;
        }
        
        emojis.forEach(emoji => {
            const button = this.createEmojiButton(emoji);
            grid.appendChild(button);
        });
    }
    
    createEmojiButton(emoji) {
        const button = document.createElement('button');
        button.className = 'emoji-item';
        button.textContent = emoji;
        button.title = emoji;
        
        // Add click handler
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            this.selectEmoji(emoji);
        });
        
        return button;
    }
    
    selectEmoji(emoji) {
        console.log('🎯 Emoji selected:', emoji);
        console.log('🎯 Reaction message ID:', window.chatApp?.reactionMessageId);
        console.log('🎯 ChatApp exists:', !!window.chatApp);
        
        // Add to recent emojis
        this.addToRecent(emoji);
        
        // Check if this is for a reaction (set by the chat app)
        if (window.chatApp && window.chatApp.reactionMessageId) {
            console.log('🎯 Processing as reaction for message:', window.chatApp.reactionMessageId);
            const messageId = window.chatApp.reactionMessageId;
            
            // Clear the reaction message ID immediately to prevent conflicts
            window.chatApp.reactionMessageId = null;
            
            // This is a reaction selection - close picker first, then add reaction
            this.hide();
            
            // Add reaction after a small delay to ensure picker is closed
            setTimeout(() => {
                window.chatApp.addReaction(messageId, emoji);
            }, 100);
            
            console.log('🎯 Reaction will be processed and picker closed');
        } else {
            // Normal emoji insertion into message input
            const messageInput = document.getElementById('message-input');
            if (messageInput) {
                const cursorPos = messageInput.selectionStart;
                const textBefore = messageInput.value.substring(0, cursorPos);
                const textAfter = messageInput.value.substring(messageInput.selectionEnd);
                
                messageInput.value = textBefore + emoji + textAfter;
                messageInput.selectionStart = messageInput.selectionEnd = cursorPos + emoji.length;
                messageInput.focus();
                
                // Trigger input event for any listeners
                messageInput.dispatchEvent(new Event('input', { bubbles: true }));
            }
        }
        
        // Hide picker
        this.hide();
    }
    
    addToRecent(emoji) {
        // Remove if already exists
        this.recentEmojis = this.recentEmojis.filter(e => e !== emoji);
        
        // Add to beginning
        this.recentEmojis.unshift(emoji);
        
        // Limit to 24 recent emojis
        this.recentEmojis = this.recentEmojis.slice(0, 24);
        
        // Save to localStorage
        localStorage.setItem('recent_emojis', JSON.stringify(this.recentEmojis));
        
        // Update recent category data
        this.emojiData.recent = this.recentEmojis;
        
        // Update recent category badge count
        this.updateRecentBadge();
    }
    
    loadRecentEmojis() {
        this.emojiData.recent = this.recentEmojis;
        this.updateRecentBadge();
    }
    
    updateRecentBadge() {
        const recentBtn = document.querySelector('[data-category="recent"]');
        if (recentBtn && this.recentEmojis.length > 0) {
            recentBtn.setAttribute('data-count', this.recentEmojis.length);
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.modernEmojiPicker = new ModernEmojiPicker();
});

// CSS for no recent emojis
const style = document.createElement('style');
style.textContent = `
.no-recent-emojis {
    grid-column: 1 / -1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 200px;
    text-align: center;
    padding: var(--space-lg);
}

.no-recent-icon {
    font-size: 48px;
    margin-bottom: var(--space-md);
    opacity: 0.5;
}

.no-recent-text {
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--text-secondary);
    margin-bottom: var(--space-xs);
}

.no-recent-subtitle {
    font-size: 0.9rem;
    color: var(--text-muted);
}
`;
document.head.appendChild(style);