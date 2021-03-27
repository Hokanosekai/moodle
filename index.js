const Discord = require('discord.js')
const imap = require('imap-simple')
const Turndown = require('turndown')
const qp = require('quoted-printable')
const utf8 = require('utf8')

const { mdp, token } = require('./config.json')
const td = new Turndown()

const config = {
    imap: {
        user: 'arsene.raillard@etudiant.univ-lr.fr',
        password: mdp,
        host: 'etudiant.univ-lr.fr',
        port: 143,
        tls: false,
    }
}

const cooldownsPin = new Map()

const bot = new Discord.Client()
let html = ""

const chan = '799629014988881940'
let msg = null

// 815267069946888224  channel test
// 799629014988881940  channel info

bot.on('ready', () => {
    console.log('\x1b[35m','\n\n⇐=','\x1b[45m\x1b[32m','moodle is now ONLINE','\x1b[40m\x1b[35m','=⇒','\x1b[37m');

    bot.user.setStatus('dnd')

    const statuses = [
        `by Hokanosekai`,
        `Affiche les derniers`,
        `Mails des profs `
    ]
    let i = 0
    setInterval(() => {
        bot.user.setActivity(statuses[i])
        i = ++i % statuses.length
    }, 2000)

    const c = bot.channels.fetch(chan)

    setInterval(() => {

        imap.connect(config).then((connection) => {

            return connection.openBox('INBOX').then(() => {

                const mails = ['Jean-François Viaud', 'Pierre Rodriguez', 'Remy Mullot', 'Christophe Saint-Jean', 'stefan.even@etudiant.univ-lr.fr', 'Diffusion_Institutionnelle_Etu@ml.univ-lr.fr']

                console.log('\n\n')
                mails.forEach(mail => {
                    const criteria = ['UNSEEN', [ 'FROM', [mail]]]

                    const fetchOpt = {
                        bodies: ['HEADER', 'TEXT'],
                        markSeen: false
                    }

                    return connection.search(criteria, fetchOpt).then((messages) => {

                        messages.forEach((item) => {

                            const header = item.parts.filter( (part) => {
                                return part.which === 'HEADER'
                            })[0].body

                            const all = item.parts.filter( (part) => {
                                return part.which === 'TEXT'
                            })

                            const info = {
                                from: header.from[0].replace('(via moodle.univ-lr.fr/2020)\" <ne-pas-repondre-moodle@univ-lr.fr>', ''),
                                date: header.date[0].slice(0, -5),
                                subject: header.subject[0].replace("[MOODLE2020]",'')
                            }
                            console.log(info.from,info.date, mail)

                            const code = header['content-type'][0].slice(header['content-type'][0].indexOf('\"')).replaceAll('\"','--')
                            let html_n
                            if (mail === "Diffusion_Institutionnelle_Etu@ml.univ-lr.fr") {
                                 html_n = qp.decode(all[0].body)
                            } else {
                                html_n = utf8.decode(qp.decode(all[0].body))
                            }

                            const r = !html_n.match(/id=(\d\d\d\d)/g) ? null : html_n.match(/id=(\d\d\d\d)/g)[0]

                            html_n = html_n.slice(html_n.indexOf('quoted-printable')+'quoted-printable'.length+1)
                            html_n = html_n.slice(html_n.indexOf('quoted-printable')+'quoted-printable'.length+1)
                            html_n = html_n.replace("<hr />",'')
                            html_n = html_n.replaceAll(code, '')
                            html_n = html_n.replace("<div class=\"mdl-align unsubscribelink\">\n" +
                                `    <a href=\"https://moodle.univ-lr.fr/2020/mod/forum/index.php?${r}\">Modifier vos préférences pour les récapitulatifs de messages de forum</a>`, '')
                            html_n = html_n.replace(`</div><p>Vous lisez ceci dans un courriel ? <a href=\"https://download.moodle.org/mobile?version=2019111803.02&amp;lang=fr&amp;iosappid=633359593&amp;androidappid=com.moodle.moodlemobile\">Téléchargez l'app mobile et recevez ainsi des notifications sur votre appareil mobile</a>.</p>`, '')

                            html = td.turndown(html_n)

                            html = html.replace("[Voir ce message dans son contexte](https://moodle.univ-lr.fr/2020/mod/forum/discuss.php?d=5176#p7754)", '')

                            // console.log("\n\n"+html)
                            // console.log(r)

                            const i = bot.users.fetch('464810880035717122')

                            const embed = new Discord.MessageEmbed()
                                .setColor("RANDOM")
                                .setAuthor(`de ${info.from} - ${info.date}`)
                                .setTitle(`**INFO** - ${info.subject}`)
                                .setDescription(utf8.decode(utf8.encode(html)))


                            c.then(channel => channel.send(embed)).catch()

                            connection.addFlags(item.attributes.uid, "\Seen", (err) => {
                                if (err) throw err
                                console.log(info.from,info.date, mail)
                            })

                        })

                    })

                })

            })

        })



    }, 1000*10)


    setInterval(() => {
        for (const [key, value] of cooldownsPin.entries()){
            if (value <= 1000*60*60) {
                msg.channel.messages.fetch(key).then(g => {
                    g.unpin().catch(err => {

                    })
                    cooldownsPin.delete(key)
                })
                return undefined
            }
            cooldownsPin.set(key , cooldownsPin.get(key) - 1000*60*60)
        }
    }, 1000*60*60)

})



bot.on('message', message => {
    if (message.author.id === '819355933519249430') {
        let id = bot.user.lastMessageID
        msg = message
        message.channel.messages.fetch(id).then(d => {
            d.pin().catch(err => {

            })
            cooldownsPin.set(id, 1000*60*60*24*7)
        })


    }


})


bot.login(token)
